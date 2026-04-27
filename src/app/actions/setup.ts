"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { z } from "zod";

const setupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().trim().min(2, "Organization name is required"),
  primarySiteName: z.string().trim().min(2, "Primary site name is required"),
});

export type SetupInput = z.infer<typeof setupSchema>;

function buildId(prefix: string, value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  return `${prefix}_${slug || "default"}`;
}

export async function completeInitialSetup(input: SetupInput): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid setup data." };
  }

  const { firstName, lastName, email, password, organizationName, primarySiteName } = parsed.data;

  const existingAdmin = await adminDb.collection("users").where("role", "==", "admin").limit(1).get();
  if (!existingAdmin.empty) {
    return { success: false, error: "Setup is already complete. Please log in." };
  }

  const now = new Date().toISOString();
  const organizationId = buildId("org", organizationName);
  const siteId = buildId("site", primarySiteName);

  let uid = "";

  try {
    const authUser = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
      emailVerified: false,
      disabled: false,
    });

    uid = authUser.uid;

    const batch = adminDb.batch();

    const orgRef = adminDb.collection("organizations").doc(organizationId);
    batch.set(orgRef, {
      id: organizationId,
      name: organizationName,
      status: "active",
      settings: {
        allowAI: true,
        allowVoiceNotes: false,
        dataRetentionMonths: 84,
        requireSupervisorReviewForHighRisk: true,
        clientIdentifierMode: "client_code",
      },
      createdAt: now,
      updatedAt: now,
    });

    const siteRef = adminDb.collection("sites").doc(siteId);
    batch.set(siteRef, {
      id: siteId,
      organizationId,
      name: primarySiteName,
      type: "shelter",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const userRef = adminDb.collection("users").doc(uid);
    batch.set(userRef, {
      id: uid,
      organizationId,
      siteIds: [siteId],
      firstName,
      lastName,
      email,
      role: "admin",
      title: "System Administrator",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });

    const auditRef = adminDb.collection("auditLogs").doc();
    batch.set(auditRef, {
      id: auditRef.id,
      organizationId,
      siteId,
      userId: uid,
      action: "setup_complete",
      entityType: "organization",
      entityId: organizationId,
      timestamp: now,
      metadata: {
        createdFirstAdmin: true,
      },
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    if (uid) {
      await adminAuth.deleteUser(uid).catch(() => undefined);
    }

    const message = error instanceof Error ? error.message : "Failed to complete setup.";
    return { success: false, error: message };
  }
}

export async function setupStatus(): Promise<{ setupComplete: boolean }> {
  const snapshot = await adminDb.collection("users").where("role", "==", "admin").limit(1).get();
  return { setupComplete: !snapshot.empty };
}
