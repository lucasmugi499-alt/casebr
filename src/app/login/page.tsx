"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, isMock } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import { User, Role } from "@/types";
import { getHomeRouteForRole } from "@/lib/auth/roleRouting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

const FIRESTORE_REQUEST_TIMEOUT_MS = 30_000;

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isMock) {
      setTimeout(() => {
        router.push(getHomeRouteForRole("admin"));
        setLoading(false);
        toast.success("Logged in as Demo Admin (Mock Mode)");
      }, 800);
      return;
    }

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const uid = userCredential.user.uid;
      let userDoc = null;
      try {
        userDoc = await getDoc(doc(db, "users", uid));
      } catch (firestoreError) {
        console.warn("Initial Firestore lookup failed:", firestoreError);
      }

      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data() as User;
        toast.success(`Welcome back, ${userData.firstName}`);
        router.push(getHomeRouteForRole(userData.role));
        return;
      }

      // If we are here, no profile exists. 
      // We will attempt to create one.
      // If it's the first user ever, we make them Admin.
      let roleToAssign: Role = "caseworker";
      let isBootstrap = false;

      try {
        // We try to see if ANY admin exists. If this fails due to rules, we'll assume we might be the first.
        const adminsSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "admin"), limit(1)));
        if (adminsSnapshot.empty) {
          roleToAssign = "admin";
          isBootstrap = true;
        }
      } catch (err) {
        console.warn("Could not check for existing admins, defaulting to caseworker.", err);
      }

      // If they are signing up, or if they are the first admin, create the profile
      if (isSignUp || isBootstrap) {
        const newProfile: User = {
          id: uid,
          organizationId: "org_casebridge_demo",
          siteIds: ["site_downtown"],
          firstName: email.split("@")[0],
          lastName: roleToAssign === "admin" ? "(Admin)" : "(Staff)",
          email,
          role: roleToAssign,
          title: roleToAssign === "admin" ? "System Administrator" : "Staff Member",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await withTimeout(
          setDoc(doc(db, "users", uid), newProfile),
          FIRESTORE_REQUEST_TIMEOUT_MS,
          "Timed out creating your profile. Please check your Firestore database is active."
        );

        toast.success(isBootstrap
          ? "System initialized. You have been registered as the first Administrator."
          : "Profile created successfully.");

        router.push(getHomeRouteForRole(newProfile.role));
        return;
      }

      await signOut(auth);
      toast.error("No staff profile found. Please Sign Up to create your account.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }

    if (isMock) {
      toast.success("Mock mode: Password reset email simulated.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <ShieldAlert className="h-6 w-6 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">CaseBridge</CardTitle>
          <CardDescription>
            {isSignUp ? "Create a new staff account." : "Log in to your shelter casework operating system."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@organization.org"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? "Please wait..." : (isSignUp ? "Sign Up" : "Log In")}
            </Button>
            {isMock && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    router.push(getHomeRouteForRole("admin"));
                    setLoading(false);
                    toast.success("Logged in as Demo Admin (Mock Mode)");
                  }, 800);
                }}
                disabled={loading}
              >
                Bypass Login (Mock Mode)
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-slate-500"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? "Already have an account? Log in" : "Need an account? Sign up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
