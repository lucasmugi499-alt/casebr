import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const createUserSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: z.enum(["caseworker", "ssa", "manager", "admin"]),
  title: z.string().trim().min(1),
  siteIds: z.array(z.string().trim().min(1)).min(1),
  temporaryPassword: z.string().min(8).optional(),
});

async function authorizeAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const requesterProfile = await adminDb.collection("users").doc(decoded.uid).get();
    if (!requesterProfile.exists || requesterProfile.data()?.role !== "admin") {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { uid: decoded.uid, profile: requesterProfile.data() as { organizationId: string; siteIds: string[] } };
  } catch {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

export async function POST(request: Request) {
  const authz = await authorizeAdmin(request);
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json();
  const parsed = createUserSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const adminProfile = authz.profile;
  const { firstName, lastName, email, role, title, siteIds, temporaryPassword } = parsed.data;

  const now = new Date().toISOString();
  const password = temporaryPassword ?? Math.random().toString(36).slice(-10) + "A1!";

  const invalidSite = siteIds.some((id) => !adminProfile.siteIds.includes(id));
  if (invalidSite) {
    return NextResponse.json({ error: "Selected site is outside your assigned access." }, { status: 400 });
  }

  let createdUid = "";

  try {
    const authUser = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
      disabled: false,
    });

    createdUid = authUser.uid;

    await adminDb.collection("users").doc(createdUid).set({
      id: createdUid,
      organizationId: adminProfile.organizationId,
      siteIds,
      firstName,
      lastName,
      email,
      role,
      title,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });

    const auditRef = adminDb.collection("auditLogs").doc();
    await auditRef.set({
      id: auditRef.id,
      organizationId: adminProfile.organizationId,
      siteId: siteIds[0],
      userId: authz.uid,
      action: "create_user",
      entityType: "user",
      entityId: createdUid,
      timestamp: now,
      metadata: {
        createdRole: role,
      },
    });

    const resetLink = await adminAuth.generatePasswordResetLink(email);

    return NextResponse.json({ success: true, uid: createdUid, resetLink });
  } catch (error) {
    if (createdUid) {
      await adminAuth.deleteUser(createdUid).catch(() => undefined);
    }

    const message = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
