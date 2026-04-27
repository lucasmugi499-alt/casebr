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
const isMock = !firebaseConfig.projectId;
const app = isMock ? null : (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

export const auth = isMock ? ({
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Simulate a signed-in admin for preview purposes
    setTimeout(() => {
      callback({
        uid: "demo-admin-uid",
        email: "admin@casebridge.demo",
        displayName: "Demo Admin",
      });
    }, 500);
    return () => {};
  },
  signOut: async () => {
    console.log("Mock sign out");
  }
} as any) : getAuth(app!);

export const db = isMock ? ({
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: () => true,
        data: () => ({
          id: "demo-admin-uid",
          role: "admin",
          firstName: "Demo",
          lastName: "Admin",
          organizationId: "org_casebridge_demo",
          siteIds: ["site_downtown", "site_east"]
        })
      })
    })
  })
} as any) : getFirestore(app!);

export { isMock };
