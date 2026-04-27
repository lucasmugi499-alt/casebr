"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged as firebaseOnAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db, isMock } from '@/lib/firebase/client';
import { doc as firestoreDoc, getDoc as firestoreGetDoc } from 'firebase/firestore';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

// Mock versions of Firebase functions
const onAuthStateChanged = isMock ? (auth as any).onAuthStateChanged : firebaseOnAuthStateChanged;
const getDoc = isMock ? async (docRef: any) => {
  if (docRef.path === 'users/demo-admin-uid') {
    return {
      exists: () => true,
      data: () => ({
        id: "demo-admin-uid",
        role: "admin",
        firstName: "Demo",
        lastName: "Admin",
        organizationId: "org_casebridge_demo",
        siteIds: ["site_downtown", "site_east"]
      })
    };
  }
  return { exists: () => false };
} : firestoreGetDoc;

const doc = isMock ? (db: any, collection: string, id: string) => ({ path: `${collection}/${id}` }) : firestoreDoc;

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

const FIRESTORE_PROFILE_TIMEOUT_MS = 10_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser: any) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          // Fetch custom user profile from Firestore to get role
          const userDoc = await withTimeout(
            getDoc(doc(db, 'users', fUser.uid)) as any,
            FIRESTORE_PROFILE_TIMEOUT_MS,
            'Timed out loading user profile from Firestore.'
          );
          if ((userDoc as any).exists()) {
            const userData = (userDoc as any).data() as User;
            setUser(userData);
          } else {
            // No custom user doc exists yet? We could handle this, maybe they are new.
            setUser(null);
          }
        } catch (error) {
          // Changed to warn so it doesn't look like a critical crash in the console
          console.warn("Could not fetch user profile from Firestore (Database might not be initialized yet). Using default role.", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
