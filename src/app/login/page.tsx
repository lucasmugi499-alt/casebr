"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create a basic default user document in Firestore for new sign-ups
        try {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            id: userCredential.user.uid,
            email: email,
            firstName: email.split('@')[0],
            lastName: "",
            role: "Caseworker", // Default role
            status: "active",
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn("Could not create user document in Firestore. Check your database rules.", err);
        }
        toast.success("Account created! Welcome to CaseBridge.");
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      let userDoc = null;
      try {
        userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      } catch (firestoreError) {
        console.warn("Firestore error (e.g. not initialized yet or offline):", firestoreError);
      }
      
      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data() as User;
        if (!isSignUp) toast.success(`Welcome back, ${userData.firstName}`);
        if (userData.role === "Caseworker") router.push("/dashboard");
        else if (userData.role === "SSA") router.push("/team");
        else if (userData.role === "Manager") router.push("/management");
        else if (userData.role === "Admin") router.push("/admin/users");
        else router.push("/dashboard"); // Fallback
      } else {
        // Fallback for demo if no custom doc
        if (!isSignUp) toast.success("Welcome to CaseBridge (Dashboard preview)");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isSignUp ? 'sign up' : 'log in'}`);
    } finally {
      setLoading(false);
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
            {isSignUp ? "Create a new shelter staff account." : "Log in to your shelter casework operating system."}
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
              <Label htmlFor="password">Password</Label>
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
