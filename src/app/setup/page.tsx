"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldAlert, Building2, UserPlus, CheckCircle2 } from "lucide-react";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const router = useRouter();

  // Form State
  const [orgName, setOrgName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteType, setSiteType] = useState("shelter");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("System Administrator");

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setAdminExists(true);
        }
      } catch (error) {
        console.error("Error checking for admin:", error);
      } finally {
        setChecking(false);
      }
    };
    checkAdmin();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Create Organization
      const orgId = `org_${Date.now()}`;
      await setDoc(doc(db, "organizations", orgId), {
        id: orgId,
        name: orgName,
        status: "active",
        settings: {
          allowAI: true,
          allowVoiceNotes: true,
          dataRetentionMonths: 24,
          requireSupervisorReviewForHighRisk: true,
          clientIdentifierMode: "client_code"
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 3. Create First Site
      const siteId = `site_${Date.now()}`;
      await setDoc(doc(db, "sites", siteId), {
        id: siteId,
        organizationId: orgId,
        name: siteName,
        type: siteType,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 4. Create Admin Profile
      await setDoc(doc(db, "users", uid), {
        id: uid,
        organizationId: orgId,
        siteIds: [siteId],
        firstName,
        lastName,
        email,
        role: "admin",
        title,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 5. Log Audit
      await setDoc(doc(db, "auditLogs", `setup_${Date.now()}`), {
        id: `setup_${Date.now()}`,
        organizationId: orgId,
        siteId,
        userId: uid,
        action: "setup_complete",
        entityType: "organization",
        entityId: orgId,
        timestamp: new Date().toISOString(),
        metadata: { orgName, adminEmail: email }
      });

      toast.success("Setup complete! Welcome to CaseBridge.");
      router.push("/admin/users");
    } catch (error: any) {
      toast.error(error.message || "Setup failed. Check console for details.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4">Setup Already Complete</CardTitle>
            <CardDescription>
              An administrator already exists for this system. Please log in to manage your organization.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/login")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">CaseBridge Initialization</CardTitle>
          <CardDescription>Set up your organization and the first administrator account.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSetup}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ORGANIZATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b pb-2">
                  <Building2 className="h-4 w-4" /> Organization & Site
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" placeholder="e.g. Metro Shelter Network" required value={orgName} onChange={e => setOrgName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteName">Primary Site Name</Label>
                  <Input id="siteName" placeholder="e.g. Downtown Site" required value={siteName} onChange={e => setSiteName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteType">Site Type</Label>
                  <Select value={siteType} onValueChange={(value) => setSiteType(value ?? "shelter")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shelter">Emergency Shelter</SelectItem>
                      <SelectItem value="drop_in">Drop-In Centre</SelectItem>
                      <SelectItem value="outreach_hub">Outreach Hub</SelectItem>
                      <SelectItem value="supportive_housing">Supportive Housing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ADMIN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b pb-2">
                  <UserPlus className="h-4 w-4" /> First Administrator
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-11 text-base font-bold" type="submit" disabled={loading}>
              {loading ? "Initializing System..." : "Complete Setup & Launch"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
