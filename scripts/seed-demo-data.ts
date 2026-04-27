import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!rawKey) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required to run the seed script.');
}

const serviceAccount = JSON.parse(rawKey);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const now = new Date().toISOString();
const organizationId = 'org_casebridge_demo';
const sites = [
  { id: 'site_downtown', name: 'Downtown Shelter' },
  { id: 'site_east', name: 'East End Shelter' },
];

const users = [
  { id: 'demo_admin', role: 'admin', firstName: 'Alex', lastName: 'Rivera', email: 'alex.admin@casebridge.demo', siteIds: ['site_downtown', 'site_east'] },
  { id: 'demo_manager', role: 'manager', firstName: 'Morgan', lastName: 'Lee', email: 'morgan.manager@casebridge.demo', siteIds: ['site_downtown', 'site_east'] },
  { id: 'demo_ssa', role: 'ssa', firstName: 'Jordan', lastName: 'Parks', email: 'jordan.ssa@casebridge.demo', siteIds: ['site_downtown', 'site_east'] },
  { id: 'demo_cw_1', role: 'caseworker', firstName: 'Sam', lastName: 'Chen', email: 'sam.cw@casebridge.demo', siteIds: ['site_downtown'] },
  { id: 'demo_cw_2', role: 'caseworker', firstName: 'Riley', lastName: 'Dawson', email: 'riley.cw@casebridge.demo', siteIds: ['site_downtown'] },
  { id: 'demo_cw_3', role: 'caseworker', firstName: 'Taylor', lastName: 'Nguyen', email: 'taylor.cw@casebridge.demo', siteIds: ['site_east'] },
  { id: 'demo_cw_4', role: 'caseworker', firstName: 'Jamie', lastName: 'Owens', email: 'jamie.cw@casebridge.demo', siteIds: ['site_east'] },
];

async function seed() {
  await db.collection('organizations').doc(organizationId).set({
    id: organizationId,
    name: 'CaseBridge Demo Shelter Network',
    status: 'active',
    settings: {
      allowAI: true,
      allowVoiceNotes: false,
      dataRetentionMonths: 24,
      requireSupervisorReviewForHighRisk: true,
      clientIdentifierMode: 'client_code',
    },
    createdAt: now,
    updatedAt: now,
  });

  for (const site of sites) {
    await db.collection('sites').doc(site.id).set({
      id: site.id,
      organizationId,
      name: site.name,
      address: 'Fictional address for demo use',
      type: 'shelter',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const user of users) {
    await db.collection('users').doc(user.id).set({
      ...user,
      organizationId,
      title: `${user.role} (Demo)`,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  for (let i = 1; i <= 15; i++) {
    const worker = users[3 + (i % 4)];
    const siteId = worker.siteIds[0];
    const clientId = `demo_client_${i}`;

    await db.collection('clients').doc(clientId).set({
      id: clientId,
      organizationId,
      siteId,
      displayName: `Client ${i} (Fictional)`,
      clientCode: `CB-${1000 + i}`,
      assignedWorkerIds: [worker.id],
      status: i % 5 === 0 ? 'follow_up_needed' : 'active',
      priority: i % 6 === 0 ? 'high' : 'medium',
      currentGoal: 'Secure housing placement and connect to income supports.',
      lastContactAt: now,
      nextFollowUpAt: now,
      createdAt: now,
      updatedAt: now,
      createdById: 'demo_admin',
    });

    await db.collection('caseNotes').doc(`demo_note_${i}`).set({
      id: `demo_note_${i}`,
      organizationId,
      siteId,
      clientId,
      authorId: worker.id,
      contactDate: now,
      contactType: 'in_person',
      category: 'housing',
      location: siteId,
      roughSummary: 'Client discussed housing and ID barriers.',
      actionsTaken: 'Completed referral intake and follow-up plan.',
      referralsMade: 'Housing access center',
      followUpRequired: true,
      riskSafetyConcerns: '',
      finalNote: 'Client reported difficulty obtaining ID. Staff supported referral to housing access and planned follow-up.',
      aiGenerated: true,
      supervisorReviewed: false,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('tasks').doc(`demo_task_${i}`).set({
      id: `demo_task_${i}`,
      organizationId,
      siteId,
      clientId,
      assignedToId: worker.id,
      createdById: worker.id,
      title: 'Follow-up on housing referral',
      description: 'Confirm agency response and update client timeline.',
      dueDate: now,
      priority: 'medium',
      status: 'open',
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('referrals').doc(`demo_referral_${i}`).set({
      id: `demo_referral_${i}`,
      organizationId,
      siteId,
      clientId,
      createdById: worker.id,
      referralType: 'housing_navigation',
      agencyName: 'Fictional Housing Access Service',
      referralDate: now,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('riskFlags').doc(`demo_risk_${i}`).set({
      id: `demo_risk_${i}`,
      organizationId,
      siteId,
      clientId,
      createdById: worker.id,
      category: 'housing_instability',
      severity: i % 4 === 0 ? 'high' : 'medium',
      description: 'Housing instability concern requiring follow-up.',
      active: true,
      supervisorReviewRequired: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('safetyPlans').doc(`demo_plan_${i}`).set({
      id: `demo_plan_${i}`,
      organizationId,
      siteId,
      clientId,
      createdById: worker.id,
      concernSummary: 'Escalating stress related to housing uncertainty.',
      triggers: 'Administrative delays and missed appointments.',
      copingStrategies: 'Grounding exercises, check-ins, peer support.',
      supports: 'Shelter staff and outreach nurse.',
      staffActions: 'Weekly check-in and appointment reminders.',
      emergencySteps: 'Escalate to supervisor and crisis supports as needed.',
      clientAgreed: true,
      reviewDate: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('supervisorReviews').doc(`demo_review_${i}`).set({
      id: `demo_review_${i}`,
      organizationId,
      siteId,
      clientId,
      riskFlagId: `demo_risk_${i}`,
      supervisorId: 'demo_ssa',
      workerId: worker.id,
      reviewType: 'risk_flag',
      comment: 'Review completed with worker. Continue supportive outreach.',
      actionRequired: true,
      actionDueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection('auditLogs').doc(`demo_audit_${i}`).set({
      id: `demo_audit_${i}`,
      organizationId,
      siteId,
      userId: worker.id,
      action: 'create_case_note',
      entityType: 'caseNote',
      entityId: `demo_note_${i}`,
      timestamp: now,
      metadata: { seeded: true },
    });
  }

  console.log('Seed completed successfully.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
