import * as admin from 'firebase-admin';

interface ServiceAccountLike {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

function readServiceAccount(): ServiceAccountLike | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ServiceAccountLike;
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY.', error);
    return null;
  }
}

if (!admin.apps.length) {
  const serviceAccount = readServiceAccount();

  if (serviceAccount?.project_id && serviceAccount.client_email && serviceAccount.private_key) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    });
  } else {
    admin.initializeApp();
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
