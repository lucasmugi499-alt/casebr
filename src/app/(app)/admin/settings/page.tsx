"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  Shield, 
  Brain, 
  Lock, 
  Eye, 
  Database,
  FileText,
  AlertTriangle,
  History,
  Save,
  RefreshCw
} from "lucide-react";
import { getDemoStore, updateDemoOrganization, addDemoAuditLog } from "@/lib/demo/demoStore";
import { Organization } from "@/types";
import { toast } from "sonner";

export default function OrganizationSettingsPage() {
  const { user: currentUser } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const store = getDemoStore();
    setOrg(store.organization);
    setLoading(false);
  }, []);

  const handleUpdate = (path: string, value: any) => {
    if (!org) return;
    
    // Simple path updater for organization settings
    const keys = path.split('.');
    const newOrg = { ...org };
    let current: any = newOrg;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setOrg(newOrg);
  };

  const saveSettings = async () => {
    if (!org) return;
    setSaving(true);
    
    try {
      updateDemoOrganization(org);
      addDemoAuditLog({
        organizationId: org.id,
        userId: currentUser?.id || "demo_admin",
        action: "update_settings",
        entityType: "organization",
        entityId: org.id,
        metadata: { updatedFields: "organization_settings" }
      });
      toast.success("Organization settings updated successfully.");
    } catch (error) {
      toast.error("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !org) {
    return <div className="p-8 text-center text-muted-foreground italic">Loading settings...</div>;
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
            <p className="text-muted-foreground">Configure global system behavior, AI policies, and data privacy.</p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* AI & DOCUMENTATION */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">AI & Documentation</CardTitle>
                  <CardDescription>Control how AI assistance is used across the system.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Allow AI-Assisted Case Notes</Label>
                  <p className="text-sm text-muted-foreground">Enables AI professional drafting for caseworkers.</p>
                </div>
                <Switch 
                  checked={org.settings.allowAI} 
                  onCheckedChange={(v) => handleUpdate('settings.allowAI', v)} 
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Require AI Disclosure</Label>
                  <p className="text-sm text-muted-foreground">Automatically mark all AI-assisted notes with a disclaimer.</p>
                </div>
                <Switch 
                  checked={true} // Hardcoded for demo
                  onCheckedChange={() => {}} 
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-6">
                <div className="space-y-1">
                  <Label className="text-base">Allow Voice-to-Text Transcription</Label>
                  <p className="text-sm text-muted-foreground">Allow staff to record and transcribe session notes.</p>
                </div>
                <Switch 
                  checked={org.settings.allowVoiceNotes} 
                  onCheckedChange={(v) => handleUpdate('settings.allowVoiceNotes', v)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* PRIVACY & DATA */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Privacy & Access Control</CardTitle>
                  <CardDescription>Configure data visibility and retention policies.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Client Identifier Mode</Label>
                <p className="text-sm text-muted-foreground max-w-lg">Controls how clients are identified across dashboards to balance privacy and operational clarity.</p>
                <Select 
                  value={org.settings.clientIdentifierMode} 
                  onValueChange={(v) => handleUpdate('settings.clientIdentifierMode', v)}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_code">Client Code Only (High Privacy)</SelectItem>
                    <SelectItem value="initials">Initials & Code</SelectItem>
                    <SelectItem value="display_name">Display Name (Standard)</SelectItem>
                    <SelectItem value="legal_name">Full Legal Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 border-t pt-6">
                <Label className="text-base">Data Retention (Months)</Label>
                <p className="text-sm text-muted-foreground">Duration before records are eligible for archival or deletion.</p>
                <Input 
                  type="number" 
                  className="max-w-[150px]" 
                  value={org.settings.dataRetentionMonths} 
                  onChange={(e) => handleUpdate('settings.dataRetentionMonths', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* WORKFLOW REQUIREMENTS */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Workflow Standards</CardTitle>
                  <CardDescription>Define mandatory steps for case management.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Mandatory Supervisor Review</Label>
                  <p className="text-sm text-muted-foreground">Require supervisor sign-off on all high-risk flags.</p>
                </div>
                <Switch 
                  checked={org.settings.requireSupervisorReviewForHighRisk} 
                  onCheckedChange={(v) => handleUpdate('settings.requireSupervisorReviewForHighRisk', v)} 
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-6">
                <div className="space-y-1">
                  <Label className="text-base">Housing Plan Requirement</Label>
                  <p className="text-sm text-muted-foreground">Automatically trigger housing plan workflow if housing need identified.</p>
                </div>
                <Switch 
                  checked={true}
                  onCheckedChange={() => {}} 
                />
              </div>
            </CardContent>
          </Card>

          {/* SYSTEM MAINTENANCE */}
          <Card className="border-destructive/20 shadow-destructive/5 bg-destructive/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-lg">System Maintenance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-destructive/80 italic">The following actions are destructive and should be used with extreme caution.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="bg-white border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors" onClick={() => {
                  if (confirm("This will clear all local session data. Continue?")) {
                    localStorage.removeItem("casebridge_demo_store_v1");
                    window.location.reload();
                  }
                }}>
                  Reset Session Data
                </Button>
                <Button variant="outline" size="sm" className="bg-white border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors">
                  Purge Audit Logs (Older than 1 Year)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
