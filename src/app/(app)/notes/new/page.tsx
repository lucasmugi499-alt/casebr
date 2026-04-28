"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { 
  addDemoCaseNote, 
  addDemoTask, 
  addDemoReferral, 
  addDemoRiskFlag,
  updateDemoWorkstream,
  addDemoTimelineItem,
  getDemoStore
} from "@/lib/demo/demoStore";
import { getDemoClientsForUser, getDemoNeedsForClient, getDemoWorkstreamsForClient, getDemoGeneratedDocumentsForClient } from "@/lib/demo/demoServices";
import { generateCaseNoteText, CaseNoteAnswers } from "@/lib/casework/caseNoteGenerator";
import { Client, ContactType, NoteCategory, WorkstreamType, Priority } from "@/types";
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  ClipboardCopy, 
  Sparkles, 
  Link as LinkIcon, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  User
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CONTACT_TYPES: ContactType[] = [
  "in_person", "phone", "email", "outreach", "appointment_accompaniment", 
  "case_conference", "crisis_support", "informal_check_in", "referral_support", 
  "housing_support", "intake_follow_up", "plan_review", "document_support", "other"
];

const NOTE_CATEGORIES: NoteCategory[] = [
  "general_check_in", "intake_assessment", "housing", "income_support", 
  "identification", "mental_health", "substance_use", "safety_planning", 
  "medical_health", "employment", "legal", "family_supports", 
  "behavioural_incident_follow_up", "discharge_planning", "system_navigation", 
  "referral_follow_up", "service_plan_update", "document_checklist_update"
];

const LOCATIONS = [
  "Shelter common area", "Office", "Client room/bed area", "Community", 
  "Phone", "Email", "External agency", "Appointment location", "Other"
];

const PLAN_TYPES = [
  "Intake Assessment", "Housing Plan", "Safety Plan", "Service Plan", 
  "Document Checklist", "Discharge / Transition Plan", "Other"
];

export default function NewCaseNotePage() {
  const { id: routeId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const clientIdFromQuery = searchParams.get("clientId");
  const initialClientId = routeId || clientIdFromQuery || "";

  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [answers, setAnswers] = useState<CaseNoteAnswers>({
    contactDate: new Date().toISOString().split("T")[0],
    contactTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    contactType: "in_person",
    location: "Office",
    noteCategory: "general_check_in",
    roughSummary: "",
    clientReport: "",
    staffObservation: "",
    actionTaken: "",
    clientResponse: "",
    outcome: "",
    followUpRequired: false
  });
  const [finalNote, setFinalNote] = useState("");

  // Options State
  const [clients, setClients] = useState<Client[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [workstreams, setWorkstreams] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  useEffect(() => {
    const actor = getDemoActor();
    if (actor) {
      setClients(getDemoClientsForUser(actor));
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      const actor = getDemoActor();
      if (actor) {
        setNeeds(getDemoNeedsForClient(selectedClientId));
        setWorkstreams(getDemoWorkstreamsForClient(selectedClientId));
        setDocuments(getDemoGeneratedDocumentsForClient(selectedClientId));
      }
    }
  }, [selectedClientId]);

  const setField = (key: keyof CaseNoteAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    if (!selectedClient || !user) {
      toast.error("Please select a client first.");
      return;
    }
    setGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      const text = generateCaseNoteText(selectedClient, `${user.firstName} ${user.lastName}`, "Main Shelter", answers);
      setFinalNote(text);
      setGenerating(false);
      toast.success("Professional note generated.");
    }, 800);
  };

  const handleSave = async () => {
    const actor = getDemoActor();
    if (!selectedClient || !actor || !finalNote) {
      toast.error("Please select a client and generate a note first.");
      return;
    }

    setSaving(true);
    try {
      const noteId = `note_${Date.now()}`;
      
      // 1. Save Note
      addDemoCaseNote({
        id: noteId,
        clientId: selectedClient.id,
        authorId: actor.id,
        authorName: `${actor.firstName} ${actor.lastName}`,
        contactDate: answers.contactDate,
        contactType: answers.contactType,
        category: answers.noteCategory,
        finalNote: finalNote,
        roughSummary: answers.roughSummary,
        organizationId: actor.organizationId,
        siteId: selectedClient.siteId,
        aiGenerated: true,
        followUpRequired: answers.followUpRequired,
        supervisorReviewed: false
      });

      // 2. Side Effects
      
      // Update Workstream
      if (answers.relatedWorkstream) {
        updateDemoWorkstream(selectedClient.id, answers.relatedWorkstream, {
          latestAction: answers.actionTaken || "Case note documented.",
          updatedAt: new Date().toISOString(),
          status: "in_progress"
        });
      }

      // Create Task
      if (answers.followUpRequired && answers.nextAction) {
        addDemoTask({
          id: `task_note_${Date.now()}`,
          organizationId: actor.organizationId,
          siteId: selectedClient.siteId,
          clientId: selectedClient.id,
          assignedToId: actor.id,
          createdById: actor.id,
          title: answers.nextAction,
          description: `Follow-up from case note on ${answers.contactDate}.`,
          dueDate: answers.dueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "medium",
          status: "open",
        });
      }

      // Timeline Item
      addDemoTimelineItem({
        id: `tl_note_${Date.now()}`,
        type: "case_note",
        date: new Date().toISOString(),
        title: `Case Note: ${answers.noteCategory.replace("_", " ")}`,
        summary: answers.roughSummary || "Interaction documented.",
        staffId: actor.id,
        entityId: noteId,
        entityType: "caseNote",
        status: "completed",
        relatedWorkstream: answers.relatedWorkstream
      });

      toast.success("Case note saved to client file.");
      router.push(`/clients/${selectedClient.id}?tab=notes`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard.");
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Add Case Note 2.0</h2>
              <p className="text-muted-foreground text-sm">Professional workflow-connected documentation.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/clients/${selectedClientId}`)}>
              View File
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={saving || !finalNote}>
              <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: FORM */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. CONTACT DETAILS */}
            <Card>
              <CardHeader className="py-4 bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> 1. Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={!!initialClientId}>
                      <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Note Category</Label>
                    <Select value={answers.noteCategory} onValueChange={v => setField("noteCategory", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NOTE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Date</Label>
                    <Input type="date" value={answers.contactDate} onChange={e => setField("contactDate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Time</Label>
                    <Input type="time" value={answers.contactTime} onChange={e => setField("contactTime", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Type</Label>
                    <Select value={answers.contactType} onValueChange={v => setField("contactType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONTACT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={answers.location} onValueChange={v => setField("location", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 2. LINK TO WORK */}
            <Card>
              <CardHeader className="py-4 bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> 2. Link to Work
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Related Workstream</Label>
                    <Select value={answers.relatedWorkstream} onValueChange={v => setField("relatedWorkstream", v)}>
                      <SelectTrigger><SelectValue placeholder="No workstream link" /></SelectTrigger>
                      <SelectContent>
                        {workstreams.map(ws => <SelectItem key={ws.id} value={ws.type} className="capitalize">{ws.type.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Related Plan/Document</Label>
                    <Select value={answers.relatedPlanType} onValueChange={v => setField("relatedPlanType", v)}>
                      <SelectTrigger><SelectValue placeholder="No plan link" /></SelectTrigger>
                      <SelectContent>
                        {PLAN_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. WHAT HAPPENED */}
            <Card>
              <CardHeader className="py-4 bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> 3. What Happened
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Rough Summary / Interaction Notes</Label>
                  <Textarea 
                    placeholder="Enter quick notes or draft here..." 
                    value={answers.roughSummary} 
                    onChange={e => setField("roughSummary", e.target.value)} 
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>What Client Reported</Label>
                    <Textarea 
                      placeholder="Subjective report..." 
                      value={answers.clientReport} 
                      onChange={e => setField("clientReport", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Staff Observations</Label>
                    <Textarea 
                      placeholder="Objective observations..." 
                      value={answers.staffObservation} 
                      onChange={e => setField("staffObservation", e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Action Taken by Staff</Label>
                  <Textarea 
                    placeholder="What steps did you take?" 
                    value={answers.actionTaken} 
                    onChange={e => setField("actionTaken", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outcome / Response</Label>
                  <Input 
                    placeholder="Result of interaction..." 
                    value={answers.outcome} 
                    onChange={e => setField("outcome", e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* 4. FOLLOW-UP */}
            <Card>
              <CardHeader className="py-4 bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> 4. Follow-Up
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Follow-up required?</Label>
                  <Switch checked={answers.followUpRequired} onCheckedChange={v => setField("followUpRequired", v)} />
                </div>
                
                {answers.followUpRequired && (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label>Next Action</Label>
                      <Input value={answers.nextAction} onChange={e => setField("nextAction", e.target.value)} placeholder="e.g. Call client with appointment details" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Responsible Person</Label>
                        <Select value={answers.responsiblePerson} onValueChange={v => setField("responsiblePerson", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="caseworker">Caseworker</SelectItem>
                            <SelectItem value="ssa">SSA / Supervisor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" value={answers.dueDate} onChange={e => setField("dueDate", e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: GENERATION */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Generated SMIS Note
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold" onClick={handleGenerate} disabled={generating}>
                    {generating ? "Generating..." : "Regenerate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <Textarea 
                  className="min-h-[500px] font-mono text-[11px] leading-relaxed bg-white border-primary/10"
                  value={finalNote}
                  onChange={e => setFinalNote(e.target.value)}
                  placeholder="Click 'Generate SMIS-style Note' below to convert your rough notes into a professional format..."
                />
                
                {!finalNote && (
                  <Button className="w-full h-12 text-lg" onClick={handleGenerate} disabled={generating}>
                    <Sparkles className="h-5 w-5 mr-2" /> {generating ? "Generating..." : "Generate SMIS-style Note"}
                  </Button>
                )}
                
                {finalNote && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full" onClick={handleCopy}>
                      <ClipboardCopy className="h-4 w-4 mr-2" /> {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="default" className="w-full" onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Note"}
                    </Button>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Professional Standards</p>
                  <p>Ensure notes are objective, factual, and trauma-informed. Do not diagnose or include judgmental language.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
