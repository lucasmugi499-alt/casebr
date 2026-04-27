import * as admin from 'firebase-admin';

// Load service account from env if available, otherwise it falls back to default app credentials
// It's strongly recommended to provide FIREBASE_SERVICE_ACCOUNT_KEY in .env.local as a JSON string
let serviceAccount: any = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Attempt to load from a local file as fallback, as provided in instructions
    try {
      serviceAccount = require('../../../serviceAccountKey.json');
    } catch (e) {
      console.warn("Could not find serviceAccountKey.json in the root directory.");
    }
  }
} catch (error) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from environment variables.", error);
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // If no credentials found, initialize with default, but this will fail for authenticated operations
    console.warn("Initializing Firebase Admin without explicit credentials. Server actions may fail.");
    admin.initializeApp();
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
