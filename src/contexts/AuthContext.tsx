"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/types";
import { useRouter } from "next/navigation";

// Development-only demo access. Do not enable in production.
const getDemoProfile = (role: string): User | null => {
  if (process.env.NODE_ENV !== "development") return null;
  const now = new Date().toISOString();
  if (role === "caseworker") {
    return {
      id: "demo_caseworker",
      organizationId: "org_casebridge_demo",
      siteIds: ["site_downtown"],
      firstName: "Demo",
      lastName: "Caseworker",
      email: "caseworker@demo.local",
      role: "caseworker",
      title: "Shelter Caseworker",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }
  if (role === "ssa") {
    return {
      id: "demo_ssa",
      organizationId: "org_casebridge_demo",
      siteIds: ["site_downtown", "site_east"],
      firstName: "Demo",
      lastName: "Supervisor",
      email: "ssa@demo.local",
      role: "ssa",
      title: "SSA / Supervisor",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }
  if (role === "manager") {
    return {
      id: "demo_manager",
      organizationId: "org_casebridge_demo",
      siteIds: ["site_downtown", "site_east"],
      firstName: "Demo",
      lastName: "Manager",
      email: "manager@demo.local",
      role: "manager",
      title: "Program Manager",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }
  return null;
};

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
    if (!fUser) {
      if (process.env.NODE_ENV === "development") {
        const demoRole = localStorage.getItem("casebridge_demo_role");
        if (demoRole) {
          const demoUser = getDemoProfile(demoRole);
          if (demoUser) {
            setUser(demoUser);
            return;
          }
        }
      }
      setUser(null);
      return;
    }

    const userDoc = await getDoc(doc(db, "users", fUser.uid));
    if (!userDoc.exists()) {
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
  }, []);

  useEffect(() => {
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
    if (process.env.NODE_ENV === "development") {
      localStorage.removeItem("casebridge_demo_role");
    }
    await firebaseSignOut(auth);
    setUser(null);
    router.push("/login");
  };

  const refreshProfile = async () => {
    await loadProfile(auth.currentUser);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
