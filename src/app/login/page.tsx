"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import { User } from "@/types";
import { getHomeRouteForRole } from "@/lib/auth/roleRouting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

const FIRESTORE_REQUEST_TIMEOUT_MS = 10_000;

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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      let userDoc = null;
      try {
        userDoc = await withTimeout(
          getDoc(doc(db, "users", userCredential.user.uid)),
          FIRESTORE_REQUEST_TIMEOUT_MS,
          "Timed out looking up your staff profile."
        );
      } catch (firestoreError) {
        console.warn("Firestore error (e.g. not initialized yet or offline):", firestoreError);
      }
      
      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data() as User;
        toast.success(`Welcome back, ${userData.firstName}`);
        router.push(getHomeRouteForRole(userData.role));
        return;
      }

      const bootstrapAdminEmail = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
      const bootstrapAdminUid = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_UID?.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const isBootstrapAdminByEmail = Boolean(bootstrapAdminEmail && normalizedEmail === bootstrapAdminEmail);
      const isBootstrapAdminByUid = Boolean(bootstrapAdminUid && userCredential.user.uid === bootstrapAdminUid);
      let isFirstAdminBootstrap = false;

      try {
        const adminsSnapshot = await withTimeout(
          getDocs(query(collection(db, "users"), where("role", "==", "admin"), limit(1))),
          FIRESTORE_REQUEST_TIMEOUT_MS,
          "Timed out checking existing admin accounts."
        );
        isFirstAdminBootstrap = adminsSnapshot.empty;
      } catch (firestoreError) {
        console.warn("Could not check existing admins. Skipping first-admin bootstrap fallback.", firestoreError);
      }

      if (isBootstrapAdminByEmail || isBootstrapAdminByUid || isFirstAdminBootstrap) {
        const newAdmin: User = {
          id: userCredential.user.uid,
          organizationId: "org_casebridge_demo",
          siteIds: ["site_downtown"],
          firstName: email.split("@")[0],
          lastName: "Admin",
          email,
          role: "admin",
          title: "System Administrator",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await withTimeout(
          setDoc(doc(db, "users", userCredential.user.uid), newAdmin),
          FIRESTORE_REQUEST_TIMEOUT_MS,
          "Timed out creating your admin profile."
        );
        toast.success(
          isFirstAdminBootstrap
            ? "No admin profile existed yet, so this account was promoted to admin. You can now create staff accounts and roles."
            : "Admin profile ready. You can now create staff accounts and roles."
        );
        router.push("/admin/users");
        return;
      }

      await signOut(auth);
      toast.error("No staff profile found for this account. Ask an admin to create your profile and assign a role.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
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
            Log in to your shelter casework operating system.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
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
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Forgot password?
                </button>
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
              {loading ? "Please wait..." : "Log In"}
            </Button>
            <p className="text-xs text-center text-slate-500">
              Staff sign-in works after an admin creates their profile and role.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
