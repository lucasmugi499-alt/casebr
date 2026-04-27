import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }

  throw new Error("Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.");
}

if (!getApps().length) {
  const svc = getServiceAccount();
  initializeApp({
    credential: cert({
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: svc.private_key,
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

const organizationId = "org_casebridge_demo";
const sites = [
  { id: "site_downtown", name: "Downtown Shelter" },
  { id: "site_east", name: "East Shelter" },
];

const demoPassword = process.env.DEMO_USER_PASSWORD ?? (process.env.NODE_ENV === "development" ? "CaseBridgeDemo123!" : "");
if (!demoPassword) {
  throw new Error("DEMO_USER_PASSWORD is required outside development.");
}

const demoUsers = [
  { email: "admin@casebridge.demo", role: "admin", firstName: "Alex", lastName: "Admin", title: "System Administrator", siteIds: ["site_downtown", "site_east"] },
  { email: "manager@casebridge.demo", role: "manager", firstName: "Morgan", lastName: "Manager", title: "Program Manager", siteIds: ["site_downtown", "site_east"] },
  { email: "ssa@casebridge.demo", role: "ssa", firstName: "Sam", lastName: "Supervisor", title: "Senior Support Associate", siteIds: ["site_downtown", "site_east"] },
  { email: "caseworker1@casebridge.demo", role: "caseworker", firstName: "Case", lastName: "Worker1", title: "Caseworker", siteIds: ["site_downtown"] },
  { email: "caseworker2@casebridge.demo", role: "caseworker", firstName: "Case", lastName: "Worker2", title: "Caseworker", siteIds: ["site_downtown"] },
  { email: "caseworker3@casebridge.demo", role: "caseworker", firstName: "Case", lastName: "Worker3", title: "Caseworker", siteIds: ["site_east"] },
  { email: "caseworker4@casebridge.demo", role: "caseworker", firstName: "Case", lastName: "Worker4", title: "Caseworker", siteIds: ["site_east"] },
] as const;

async function upsertAuthUser(email: string, password: string, displayName: string): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, displayName, disabled: false });
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, displayName, disabled: false });
    return created.uid;
  }
}

async function seed() {
  const now = new Date().toISOString();

  await db.collection("organizations").doc(organizationId).set({
    id: organizationId,
    name: "CaseBridge Demo Organization",
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

  for (const site of sites) {
    await db.collection("sites").doc(site.id).set({
      id: site.id,
      organizationId,
      name: site.name,
      type: "shelter",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }

  const uidByEmail = new Map<string, string>();

  for (const entry of demoUsers) {
    const uid = await upsertAuthUser(entry.email, demoPassword, `${entry.firstName} ${entry.lastName}`);
    uidByEmail.set(entry.email, uid);

    await db.collection("users").doc(uid).set({
      id: uid,
      organizationId,
      siteIds: entry.siteIds,
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email,
      role: entry.role,
      title: entry.title,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });
  }

  const adminUid = uidByEmail.get("admin@casebridge.demo")!;
  const supervisorUid = uidByEmail.get("ssa@casebridge.demo")!;
  const workerUids = [
    uidByEmail.get("caseworker1@casebridge.demo")!,
    uidByEmail.get("caseworker2@casebridge.demo")!,
    uidByEmail.get("caseworker3@casebridge.demo")!,
    uidByEmail.get("caseworker4@casebridge.demo")!,
  ];

  for (let i = 1; i <= 15; i++) {
    const workerUid = workerUids[(i - 1) % workerUids.length];
    const siteId = i % 2 === 0 ? "site_downtown" : "site_east";
    const clientId = `demo_client_${i}`;

    await db.collection("clients").doc(clientId).set({
      id: clientId,
      organizationId,
      siteId,
      displayName: `Demo Client ${i}`,
      clientCode: `CB-${1000 + i}`,
      assignedWorkerIds: [workerUid],
      status: i % 5 === 0 ? "follow_up_needed" : "active",
      priority: i % 4 === 0 ? "high" : "medium",
      currentGoal: "Secure permanent housing and stabilize income.",
      createdAt: now,
      updatedAt: now,
      createdById: adminUid,
    });

    await db.collection("caseNotes").doc(`demo_note_${i}`).set({ id: `demo_note_${i}`, organizationId, siteId, clientId, authorId: workerUid, contactDate: now, contactType: "in_person", category: "housing", roughSummary: "Checked in about housing.", followUpRequired: true, finalNote: "Client is engaged and following up.", aiGenerated: false, supervisorReviewed: false, createdAt: now, updatedAt: now });
    await db.collection("tasks").doc(`demo_task_${i}`).set({ id: `demo_task_${i}`, organizationId, siteId, clientId, assignedToId: workerUid, createdById: workerUid, title: "Follow up with client", description: "Check referral progress.", dueDate: now, priority: "medium", status: "open", createdAt: now, updatedAt: now });
    await db.collection("referrals").doc(`demo_referral_${i}`).set({ id: `demo_referral_${i}`, organizationId, siteId, clientId, createdById: workerUid, referralType: "housing_navigation", agencyName: "Demo Housing Agency", referralDate: now, status: "pending", createdAt: now, updatedAt: now });
    await db.collection("riskFlags").doc(`demo_risk_${i}`).set({ id: `demo_risk_${i}`, organizationId, siteId, clientId, createdById: workerUid, category: "housing_instability", severity: i % 3 === 0 ? "high" : "medium", description: "Needs additional housing support.", active: true, supervisorReviewRequired: true, createdAt: now, updatedAt: now });
    await db.collection("safetyPlans").doc(`demo_plan_${i}`).set({ id: `demo_plan_${i}`, organizationId, siteId, clientId, createdById: workerUid, concernSummary: "Housing-related stress", triggers: "Uncertain placement", copingStrategies: "Daily check-in", supports: "Case team", staffActions: "Weekly support", emergencySteps: "Supervisor escalation", clientAgreed: true, reviewDate: now, status: "active", createdAt: now, updatedAt: now });
    await db.collection("supervisorReviews").doc(`demo_review_${i}`).set({ id: `demo_review_${i}`, organizationId, siteId, clientId, riskFlagId: `demo_risk_${i}`, supervisorId: supervisorUid, workerId: workerUid, reviewType: "risk_flag", comment: "Continue with plan.", actionRequired: true, actionDueDate: now, createdAt: now, updatedAt: now });
    await db.collection("auditLogs").doc(`demo_audit_${i}`).set({ id: `demo_audit_${i}`, organizationId, siteId, userId: workerUid, action: "seed_demo_data", entityType: "client", entityId: clientId, timestamp: now, metadata: { seeded: true } });
  }

  console.log("Seed completed successfully.");
  console.log(`Demo password: ${demoPassword}`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
