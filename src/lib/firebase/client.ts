import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const hasConfig = !!firebaseConfig.projectId;
const app = hasConfig ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

// Mock implementations for when configuration is missing entirely
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: unknown) => void) => {
    setTimeout(() => callback(null), 0);
    return () => {};
  },
  signOut: async () => {}
} as any;

const mockDb = {
  collection: () => ({ doc: () => ({ get: async () => ({ exists: () => false, data: () => null }) }) })
} as any;

export const auth = app ? getAuth(app) : mockAuth;
export const db = app ? getFirestore(app) : mockDb;
export const isConfigured = hasConfig;
export const isMock = !hasConfig;
