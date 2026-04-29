"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { exitDemoMode, getDemoUserProfile, isDemoMode } from "@/lib/demo/demoMode";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadProfile = useCallback(async (fUser: FirebaseUser | null) => {
    if (isDemoMode()) {
      setUser(getDemoUserProfile());
      return;
    }

    if (!fUser) {
      setUser(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", fUser.uid));
      if (!userDoc.exists()) {
        console.warn("Auth success but no Firestore profile found. Signing out.");
        await firebaseSignOut(auth);
        setUser(null);
        return;
      }

      const profile = userDoc.data() as User;
      if (profile.status !== "active") {
        await firebaseSignOut(auth);
        setUser(null);
        return;
      }

      setUser(profile);
    } catch (err) {
      console.error("Error loading profile:", err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      const demoUser = getDemoUserProfile();
      setUser(demoUser);
      setFirebaseUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setLoading(true);
      setFirebaseUser(fUser);

      try {
        await loadProfile(fUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const signOut = async () => {
    if (isDemoMode()) {
      exitDemoMode();
    }
    await firebaseSignOut(auth);
    setUser(null);
    router.push("/login");
  };

  const refreshProfile = async () => {
    await loadProfile(auth.currentUser);
  };

  return <AuthContext.Provider value={{ user, firebaseUser, loading, signOut, refreshProfile }}>{children}</AuthContext.Provider>;
}
