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

if (!firebaseConfig.projectId) {
  console.error("Missing Firebase configuration in .env.local. Please check your setup.");
}

// Initialize Firebase only if there are no apps already initialized
const isMock = !firebaseConfig.projectId || (typeof window !== "undefined" && localStorage.getItem("casebridge_demo_role") !== null);
const app = isMock ? null : (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

type MockAuth = ReturnType<typeof getAuth>;
type MockDb = ReturnType<typeof getFirestore>;

const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: unknown) => void) => {
    setTimeout(() => callback(null), 0);
    return () => {};
  },
  signOut: async () => {
    console.log("Mock sign out");
  }
} as unknown as MockAuth;

const mockDb = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: () => false,
        data: () => null,
      })
    })
  })
} as unknown as MockDb;

export const auth = isMock ? mockAuth : getAuth(app!);
export const db = isMock ? mockDb : getFirestore(app!);

export { isMock };
