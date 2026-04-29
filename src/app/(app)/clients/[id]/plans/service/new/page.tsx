"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { 
  completeDemoGeneratedDocumentWorkflow,
  copyDemoDocumentToSmis
} from "@/lib/demo/generatedDocumentWorkflow";
import { getDemoGeneratedDocumentsForClient } from "@/lib/demo/demoServices";
import { clientsService } from "@/lib/services/clientsService";
import { generateServicePlanText, ServicePlanAnswers, ActionStep } from "@/lib/casework/servicePlanGenerator";
import { Client, GeneratedDocument, ReferralType } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  ArrowLeft,
  FileText,
  ClipboardCopy,
  LayoutDashboard,
  Target,
  Plus,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: "goals", title: "Client Priorities and Goals", description: "What does the client want to achieve?" },
  { id: "needs", title: "Current Needs", description: "What needs were identified today?" },
  { id: "strengths", title: "Strengths and Supports", description: "What resources does the client have?" },
  { id: "barriers", title: "Barriers and Challenges", description: "What is standing in the way?" },
  { id: "actions", title: "Action Steps", description: "Who is doing what and by when?" },
  { id: "referrals", title: "Referrals and Supports", description: "Connecting the client to services." },
  { id: "followup", title: "Review and Follow-Up", description: "Planning for the next check-in." },
  { id: "review", title: "Review", description: "Verify all information before finalizing." },
  { id: "finish", title: "Finish", description: "Generate and save SMIS-ready documentation." }
];

const GOAL_CATEGORIES = [
  "Housing", "Income / Benefits", "Identification / Documents", "Health / Medical", 
  "Mental Health", "Substance Use Support", "Employment", "Legal", 
  "Family / Community Supports", "Safety", "Life Skills", "Education / Training", "Other"
];

const BARRIER_OPTIONS = [
  "no income", "limited income", "missing ID/documents", "housing availability", 
  "rental arrears", "credit history", "mental health concern", "substance use concern", 
  "health/medical issue", "legal issue", "family conflict", "transportation", 
  "language barrier", "discrimination", "limited phone/internet access", "system navigation difficulty", "other"
];

const NEED_OPTIONS = [
  "housing support", "income or benefits support", "ID or document replacement", 
  "health or medical follow-up", "mental health support", "substance use support", 
  "legal support", "employment support", "family/community support", "safety planning", 
  "appointment support", "transportation support", "clothing/food/basic needs", "other"
];

export default function NewServicePlanPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [client, setClient] = useState<Client | null>(null);
  const [answers, setAnswers] = useState<ServicePlanAnswers>(() => {
    if (typeof window === "undefined") return { actionSteps: [], identifiedNeeds: [], barriers: [], referralTypes: [] };
    const raw = window.localStorage.getItem(`service_plan_draft_${id}`);
    return raw ? JSON.parse(raw) : { actionSteps: [], identifiedNeeds: [], barriers: [], referralTypes: [] };
  });
  const [generatedText, setGeneratedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  const storageKey = useMemo(() => `service_plan_draft_${id}`, [id]);

  useEffect(() => {
    if (!user || !id) return;
    clientsService.getClientById(id, { 
      id: user.id, 
      organizationId: user.organizationId, 
      role: user.role, 
      siteIds: user.siteIds 
    }).then(setClient);
  }, [id, user]);

  const setField = (key: keyof ServicePlanAnswers, value: any) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const saveDraft = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
    toast.info("Draft saved locally");
  };

  const nextStep = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
    if (currentStep === STEPS.length - 2) {
      if (client && user) {
        const text = generateServicePlanText(client, `${user.firstName} ${user.lastName}`, client.siteId, answers);
        setGeneratedText(text);
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success("Copied to clipboard for SMIS");
    
    const actor = getDemoActor();
    if (actor && client && savedDocId) {
      copyDemoDocumentToSmis(client.id, savedDocId, actor);
    }
    
    setTimeout(() => setCopied(false), 2000);
  };

  const addActionStep = () => {
    const newStep: ActionStep = {
      category: "Housing",
      action: "",
      responsible: "client",
      dueDate: "",
      followUpDate: "",
      priority: "medium",
      status: "not_started"
    };
    setField("actionSteps", [...(answers.actionSteps || []), newStep]);
  };

  const removeActionStep = (index: number) => {
    setField("actionSteps", (answers.actionSteps || []).filter((_, i) => i !== index));
  };

  const updateActionStep = (index: number, field: keyof ActionStep, value: any) => {
    const steps = [...(answers.actionSteps || [])];
    steps[index] = { ...steps[index], [field]: value };
    setField("actionSteps", steps);
  };

  const finalizePlan = () => {
    const actor = getDemoActor();
    if (!actor || !client) return;

    setSaving(true);
    try {
      const taskData = (answers.createTasksFromSteps === "yes" && answers.actionSteps) 
        ? answers.actionSteps.map(step => ({
            title: `${step.category}: ${step.action}`,
            description: `Action step from Service Plan. Responsible: ${step.responsible}`,
            dueDate: step.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            priority: step.priority,
          }))
        : [];

      const referralData = (answers.createReferralsFromPlan === "yes" && answers.referralTypes)
        ? answers.referralTypes.map(type => ({
            referralType: type as ReferralType,
            agencyName: answers.agenciesToContact || "To be determined",
          }))
        : [];

      const savedDoc = completeDemoGeneratedDocumentWorkflow({
        client,
        actor,
        documentType: "service_plan",
        title: `Service Plan - ${client.displayName}`,
        generatedText,
        sourceAnswers: answers,
        relatedWorkstreamType: "other", // Service plan is broad
        checklistUpdates: { servicePlanCompleted: true },
        reviewDate: answers.reviewDate,
        createTask: taskData.length > 0,
        taskData: taskData as any,
        createReferral: referralData.length > 0,
        referralData: referralData as any,
        supervisorReviewRequested: answers.requestSupervisorReview === "yes"
      });

      setSavedDocId(savedDoc.id);

      window.localStorage.removeItem(storageKey);
      toast.success("Service Plan saved to client file");
      router.push(`/clients/${client.id}?tab=plans&success=service_plan_saved`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save service plan");
    } finally {
      setSaving(false);
    }
  };

  if (!client) return <div className="p-8 text-center">Loading case planning wizard...</div>;

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "goals":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What are the client’s main priorities right now?</Label>
              <Textarea placeholder="e.g. Health stabilization, obtaining housing, replacing ID." value={answers.priorities || ""} onChange={e => setField("priorities", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What is the client’s primary goal?</Label>
              <Input placeholder="Single main objective" value={answers.primaryGoal || ""} onChange={e => setField("primaryGoal", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Secondary goals?</Label>
              <Textarea value={answers.secondaryGoals || ""} onChange={e => setField("secondaryGoals", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client participated?</Label>
                <Select value={answers.clientParticipated} onValueChange={v => setField("clientParticipated", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client agreed with goals?</Label>
                <Select value={answers.clientAgreed} onValueChange={v => setField("clientAgreed", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case "needs":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Needs identified today</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {NEED_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(answers.identifiedNeeds || []).includes(opt)}
                      onChange={e => {
                        const current = answers.identifiedNeeds || [];
                        if (e.target.checked) setField("identifiedNeeds", [...current, opt]);
                        else setField("identifiedNeeds", current.filter(x => x !== opt));
                      }}
                    />
                    <span className="capitalize">{opt.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Which needs are urgent?</Label>
              <Input value={answers.urgentNeeds || ""} onChange={e => setField("urgentNeeds", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Which needs are ongoing?</Label>
              <Input value={answers.ongoingNeeds || ""} onChange={e => setField("ongoingNeeds", e.target.value)} />
            </div>
          </div>
        );
      case "strengths":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client strengths?</Label>
              <Textarea value={answers.strengths || ""} onChange={e => setField("strengths", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Family, friends, cultural, faith, or peer supports?</Label>
              <Textarea value={answers.communitySupports || ""} onChange={e => setField("communitySupports", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Involved agencies or workers?</Label>
              <Input value={answers.involvedAgencies || ""} onChange={e => setField("involvedAgencies", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What is the client motivated by?</Label>
              <Input value={answers.motivation || ""} onChange={e => setField("motivation", e.target.value)} />
            </div>
          </div>
        );
      case "barriers":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Identified Barriers</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {BARRIER_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(answers.barriers || []).includes(opt)}
                      onChange={e => {
                        const current = answers.barriers || [];
                        if (e.target.checked) setField("barriers", [...current, opt]);
                        else setField("barriers", current.filter(x => x !== opt));
                      }}
                    />
                    <span className="capitalize">{opt.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Main challenge right now?</Label>
              <Input value={answers.mainChallenge || ""} onChange={e => setField("mainChallenge", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>System barriers or navigation difficulty?</Label>
              <Textarea value={answers.systemBarriers || ""} onChange={e => setField("systemBarriers", e.target.value)} />
            </div>
          </div>
        );
      case "actions":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-bold">Action Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={addActionStep}>
                <Plus className="h-4 w-4 mr-2" /> Add Step
              </Button>
            </div>
            
            {(answers.actionSteps || []).map((step, idx) => (
              <Card key={idx} className="border-primary/20">
                <CardHeader className="py-3 bg-muted/30 flex flex-row justify-between items-center">
                  <CardTitle className="text-sm">Action Step {idx + 1}</CardTitle>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 h-8" onClick={() => removeActionStep(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Goal Category</Label>
                      <Select value={step.category} onValueChange={v => updateActionStep(idx, "category", v)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GOAL_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Responsible</Label>
                      <Select value={step.responsible} onValueChange={v => updateActionStep(idx, "responsible", v)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="caseworker">Caseworker</SelectItem>
                          <SelectItem value="ssa">SSA / Supervisor</SelectItem>
                          <SelectItem value="housing_worker">Housing Worker</SelectItem>
                          <SelectItem value="external">External Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Action</Label>
                    <Input className="h-8" value={step.action} onChange={e => updateActionStep(idx, "action", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Due Date</Label>
                      <Input type="date" className="h-8" value={step.dueDate} onChange={e => updateActionStep(idx, "dueDate", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase">Status</Label>
                      <Select value={step.status} onValueChange={v => updateActionStep(idx, "status", v)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="waiting">Waiting</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(answers.actionSteps || []).length === 0 && (
              <div className="p-8 border-2 border-dashed rounded-lg text-center space-y-2">
                <p className="text-sm text-muted-foreground">No action steps added yet.</p>
                <Button type="button" variant="outline" size="sm" onClick={addActionStep}>Add First Action Step</Button>
              </div>
            )}
          </div>
        );
      case "referrals":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Are any referrals needed?</Label>
              <Select value={answers.referralsNeeded} onValueChange={v => setField("referralsNeeded", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referral types needed</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {["housing", "income support", "ID replacement", "health/medical", "mental health", "substance use", "employment", "legal", "basic needs"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(answers.referralTypes || []).includes(opt)}
                      onChange={e => {
                        const current = answers.referralTypes || [];
                        if (e.target.checked) setField("referralTypes", [...current, opt]);
                        else setField("referralTypes", current.filter(x => x !== opt));
                      }}
                    />
                    <span className="capitalize">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Agencies or services to contact?</Label>
              <Input value={answers.agenciesToContact || ""} onChange={e => setField("agenciesToContact", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Appointments or accompaniment needed?</Label>
              <Input value={answers.appointmentsNeeded || ""} onChange={e => setField("appointmentsNeeded", e.target.value)} />
            </div>
          </div>
        );
      case "followup":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Next follow-up date</Label>
                <Input type="date" value={answers.nextFollowUpDate || ""} onChange={e => setField("nextFollowUpDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Service plan review date</Label>
                <Input type="date" value={answers.reviewDate || ""} onChange={e => setField("reviewDate", e.target.value)} />
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <Label>Create tasks from action steps?</Label>
                <Select value={answers.createTasksFromSteps} onValueChange={v => setField("createTasksFromSteps", v)}>
                  <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <Label>Create referrals from plan?</Label>
                <Select value={answers.createReferralsFromPlan} onValueChange={v => setField("createReferralsFromPlan", v)}>
                  <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <Label>Request supervisor review?</Label>
                <Select value={answers.requestSupervisorReview} onValueChange={v => setField("requestSupervisorReview", v)}>
                  <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label>Internal follow-up notes for staff?</Label>
              <Textarea value={answers.staffFollowUpNotes || ""} onChange={e => setField("staffFollowUpNotes", e.target.value)} />
            </div>
          </div>
        );
      case "review":
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 bg-muted/50 rounded-lg space-y-4 text-sm">
              <div><p className="text-muted-foreground font-semibold">Primary Goal</p><p>{answers.primaryGoal || "N/A"}</p></div>
              <div><p className="text-muted-foreground font-semibold">Needs</p><p>{answers.identifiedNeeds?.join(", ") || "N/A"}</p></div>
              <div>
                <p className="text-muted-foreground font-semibold">Action Steps ({answers.actionSteps?.length || 0})</p>
                <div className="space-y-1 mt-1">
                  {answers.actionSteps?.map((s, i) => <p key={i} className="text-xs border-l-2 border-primary pl-2">{s.action} ({s.responsible})</p>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-2">
                <div><p className="text-muted-foreground font-semibold">Review Date</p><p>{answers.reviewDate || "N/A"}</p></div>
                <div><p className="text-muted-foreground font-semibold">Supervisor Review</p><p>{answers.requestSupervisorReview === "yes" ? "Requested" : "No"}</p></div>
              </div>
            </div>
          </div>
        );
      case "finish":
        return (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <Target className="h-5 w-5" /> SMIS-Ready Service Plan
                  </h4>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <ClipboardCopy className="h-4 w-4 mr-2" /> {copied ? "Copied!" : "Copy for SMIS"}
                  </Button>
                </div>
                <Textarea value={generatedText} readOnly className="min-h-[400px] font-mono text-xs leading-relaxed bg-white border-primary/10" />
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={finalizePlan} className="flex-1 h-12 text-lg" disabled={saving}>
                <Save className="h-5 w-5 mr-2" /> {saving ? "Saving..." : "Save to Client File"}
              </Button>
              <Link href={`/clients/${client.id}`} className={buttonVariants({ variant: "outline", className: "flex-1 h-12" })}>
                <LayoutDashboard className="h-5 w-5 mr-2" /> Return to Client File
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AuthGuard allowedRoles={["caseworker"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Service Plan Wizard</h2>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
          <Link href={`/clients/${id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to File
          </Link>
        </div>

        <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
          {STEPS.map((s, idx) => (
            <div key={s.id} className={cn("h-full flex-1 transition-all duration-300", idx <= currentStep ? "bg-primary" : "bg-muted", idx === currentStep ? "opacity-100" : "opacity-40")} />
          ))}
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">{currentStep + 1}</div>
                <CardTitle className="text-lg">{STEPS[currentStep].title}</CardTitle>
              </div>
              {currentStep < STEPS.length - 1 && <Button variant="outline" size="sm" onClick={saveDraft}><Save className="h-4 w-4 mr-2" /> Save Draft</Button>}
            </div>
          </CardHeader>
          <CardContent className="p-6">{renderStep()}</CardContent>
          {currentStep < STEPS.length - 1 && (
            <div className="p-6 border-t bg-muted/10 flex justify-between">
              <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}><ChevronLeft className="h-4 w-4 mr-2" /> Previous</Button>
              <Button onClick={nextStep}>{currentStep === STEPS.length - 2 ? "Finish Plan" : "Next"} <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </div>
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}
