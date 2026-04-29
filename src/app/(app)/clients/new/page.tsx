"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { 
  addDemoClient, 
  addDemoAuditLog, 
  addDemoTimelineItem,
  addDemoClientNeed
} from "@/lib/demo/demoStore";
import { ClientStatus, Priority } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  UserPlus, 
  ClipboardList, 
  MapPin, 
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    siteId: user?.siteIds?.[0] || "",
    priority: "medium" as Priority,
    status: "intake" as ClientStatus,
    referralSource: "",
    referralNotes: "",
    currentGoal: "Complete initial intake and housing assessment",
    needs: [] as string[]
  });

  const setField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submit = async () => {
    const actor = getDemoActor();
    if (!actor) return;

    if (!formData.firstName || !formData.lastName || !formData.siteId) {
      toast.error("Please fill in required fields.");
      return;
    }

    setSaving(true);
    try {
      const displayName = `${formData.firstName} ${formData.lastName}`;
      const clientCode = `CB-${Math.floor(Math.random() * 90000) + 10000}`;
      
      const newClient = addDemoClient({
        organizationId: actor.organizationId,
        siteId: formData.siteId,
        displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        clientCode,
        assignedWorkerIds: [actor.id],
        status: formData.status,
        priority: formData.priority,
        currentGoal: formData.currentGoal,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        createdById: actor.id,
      });

      // Log initial timeline events
      addDemoTimelineItem({
        id: `tl_referral_${Date.now()}`,
        clientId: newClient.id,
        type: "referral",
        date: new Date().toISOString(),
        title: "Referral Received",
        summary: formData.referralSource ? `Referral from ${formData.referralSource}. ${formData.referralNotes}` : "Self-referral or walk-in intake initiated.",
        staffId: actor.id,
        entityId: newClient.id,
        entityType: "client",
        status: "completed"
      });

      addDemoTimelineItem({
        id: `tl_intake_start_${Date.now()}`,
        clientId: newClient.id,
        type: "intake_assessment",
        date: new Date().toISOString(),
        title: "Intake Process Started",
        summary: "Client record created. Pending comprehensive intake assessment.",
        staffId: actor.id,
        entityId: newClient.id,
        entityType: "client",
        status: "in_progress"
      });

      addDemoAuditLog({
        organizationId: actor.organizationId,
        siteId: formData.siteId,
        userId: actor.id,
        action: "create_client",
        entityType: "client",
        entityId: newClient.id,
        metadata: { clientCode }
      });

      toast.success("Client record created successfully.");
      router.push(`/clients/${newClient.id}?tab=overview`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create client record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "admin"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">New Intake / Referral</h1>
              <p className="text-muted-foreground text-sm">Create a new client record and start the intake process.</p>
            </div>
          </div>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Creating..." : "Create Client Record"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Personal Information
                </CardTitle>
                <CardDescription>Legal name and basic demographics for identity verification.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="firstName" 
                    placeholder="e.g. John" 
                    value={formData.firstName} 
                    onChange={e => setField("firstName", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="lastName" 
                    placeholder="e.g. Doe" 
                    value={formData.lastName} 
                    onChange={e => setField("lastName", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input 
                    id="dob" 
                    type="date" 
                    value={formData.dateOfBirth} 
                    onChange={e => setField("dateOfBirth", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={v => setField("gender", v)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non_binary">Non-Binary</SelectItem>
                      <SelectItem value="two_spirit">Two-Spirit</SelectItem>
                      <SelectItem value="other">Other / Not Specified</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> Referral Source
                </CardTitle>
                <CardDescription>How did the client find our services?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referralSource">Referral Source Agency / Program</Label>
                  <Input 
                    id="referralSource" 
                    placeholder="e.g. Central Intake, Street Outreach, Self" 
                    value={formData.referralSource} 
                    onChange={e => setField("referralSource", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referralNotes">Referral Notes</Label>
                  <Textarea 
                    id="referralNotes" 
                    placeholder="Reason for referral, urgency, or initial concerns..." 
                    value={formData.referralNotes} 
                    onChange={e => setField("referralNotes", e.target.value)} 
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site">Assigned Site <span className="text-destructive">*</span></Label>
                  <Select value={formData.siteId} onValueChange={v => setField("siteId", v)}>
                    <SelectTrigger id="site">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.siteIds.map(sid => (
                        <SelectItem key={sid} value={sid}>{sid}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Initial Priority</Label>
                  <Select value={formData.priority} onValueChange={v => setField("priority", v)}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" /> Intake Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Creating a client record will automatically:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Generate a unique CaseBridge ID</li>
                  <li>Initialize documentation checklists</li>
                  <li>Assign you as the primary worker</li>
                  <li>Log a referral event in the timeline</li>
                </ul>
              </CardContent>
            </Card>

            <div className="pt-2">
              <Button className="w-full h-12 text-lg" onClick={submit} disabled={saving}>
                <FileText className="h-5 w-5 mr-2" /> Finish Intake
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
