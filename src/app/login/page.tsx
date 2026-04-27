"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth, db, isMock } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/types";
import { getHomeRouteForRole } from "@/lib/auth/roleRouting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        toast.error("No staff profile found for this account. Please ask your administrator to create your profile.");
        return;
      }

      const userData = userDoc.data() as User;
      if (userData.status !== "active") {
        await signOut(auth);
        toast.error("This account is inactive. Please contact your administrator.");
        return;
      }

      toast.success(`Welcome back, ${userData.firstName}`);
      router.push(getHomeRouteForRole(userData.role));
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
          <CardDescription>Log in to your shelter casework operating system.</CardDescription>
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
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
