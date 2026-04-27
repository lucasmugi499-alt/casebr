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

function readServiceAccountFromDiscreteEnv(): ServiceAccountLike | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}

if (!admin.apps.length) {
  const serviceAccount = readServiceAccount() ?? readServiceAccountFromDiscreteEnv();

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
