"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { 
  completeDemoGeneratedDocumentWorkflow,
  copyDemoDocumentToSmis
} from "@/lib/demo/generatedDocumentWorkflow";
import { clientsService } from "@/lib/services/clientsService";
import { generateDischargePlanText, DischargePlanAnswers } from "@/lib/casework/dischargePlanGenerator";
import { Client, GeneratedDocument, ClientStatus } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  ArrowLeft,
  FileText,
  ClipboardCopy,
  LayoutDashboard,
  Calendar,
  User,
  MapPin,
  Heart,
  ExternalLink,
  Plus,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: "reason", title: "Reason & Type", description: "Why is the client transitioning?" },
  { id: "summary", title: "Casework Summary", description: "Progress made during shelter stay." },
  { id: "destination", title: "Destination Plan", description: "Where is the client going?" },
  { id: "needs", title: "Basic Needs & Docs", description: "Income, identification, and essentials." },
  { id: "health", title: "Health & Safety", description: "Ongoing wellness and safety supports." },
  { id: "referrals", title: "Follow-Up Supports", description: "Referrals and responsible agencies." },
  { id: "participation", title: "Client Perspective", description: "Involvement and agreement." },
  { id: "action", title: "Action Plan", description: "Final transition tasks." },
  { id: "review", title: "Review", description: "Verify plan details." },
  { id: "finish", title: "Generate & Save", description: "SMIS-ready documentation." }
];

export default function NewDischargePlanPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [client, setClient] = useState<Client | null>(null);
  const [answers, setAnswers] = useState<DischargePlanAnswers>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(`discharge_plan_draft_${id}`);
    return raw ? JSON.parse(raw) : {
      actions: []
    };
  });
  const [generatedText, setGeneratedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [finalStatus, setFinalStatus] = useState<ClientStatus | "">("");
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  const storageKey = useMemo(() => `discharge_plan_draft_${id}`, [id]);

  useEffect(() => {
    if (!user || !id) return;
    clientsService.getClientById(id, { 
      id: user.id, 
      organizationId: user.organizationId, 
      role: user.role, 
      siteIds: user.siteIds 
    }).then(setClient);
  }, [id, user]);

  const setField = (key: keyof DischargePlanAnswers, value: any) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const saveDraft = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  };

  const addAction = () => {
    const nextActions = [
      ...(answers.actions || []),
      { action: "", responsible: "caseworker", dueDate: "", followUpDate: "", status: "open" }
    ];
    setField("actions", nextActions);
  };

  const updateAction = (index: number, field: string, value: string) => {
    const nextActions = [...(answers.actions || [])];
    nextActions[index] = { ...nextActions[index], [field]: value };
    setField("actions", nextActions);
  };

  const removeAction = (index: number) => {
    const nextActions = (answers.actions || []).filter((_, i) => i !== index);
    setField("actions", nextActions);
  };

  const nextStep = () => {
    saveDraft();
    if (currentStep === STEPS.length - 2) {
      if (client && user) {
        const text = generateDischargePlanText(client, `${user.firstName} ${user.lastName}`, "Metro Shelter Main", answers);
        setGeneratedText(text);
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleFinish = async () => {
    const actor = getDemoActor();
    if (!actor || !client) return;
    setSaving(true);

    try {
      const taskData = (answers.actions && answers.actions.length > 0)
        ? answers.actions.map(a => ({
            title: `[Transition] ${a.action}`,
            description: `Follow-up required: ${a.action}. Responsible: ${a.responsible}.`,
            dueDate: a.dueDate || new Date().toISOString(),
            priority: "medium" as const
          }))
        : [];

      const savedDoc = completeDemoGeneratedDocumentWorkflow({
        client,
        actor,
        documentType: "discharge_transition_plan",
        title: "Discharge / Transition Plan",
        generatedText,
        sourceAnswers: answers,
        relatedWorkstreamType: "housing", // Usually related to housing outcome
        checklistUpdates: {
          dischargeTransitionPlanDocumented: true
        },
        statusUpdate: finalStatus || undefined,
        createTask: taskData.length > 0,
        taskData: taskData
      });

      setSavedDocId(savedDoc.id);

      window.localStorage.removeItem(storageKey);
      toast.success("Discharge / Transition Plan saved to client file.");
      router.push(`/clients/${client.id}?tab=plans`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save plan.");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboardForSmis = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success("Copied to clipboard for SMIS.");
    
    const actor = getDemoActor();
    if (actor && client && savedDocId) {
      copyDemoDocumentToSmis(client.id, savedDocId, actor);
    }
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (!client) return <div className="p-8 text-center">Loading client data...</div>;

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/clients/${id}?tab=plans`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Discharge / Transition Plan</h1>
            <p className="text-muted-foreground text-sm">Client: {client.displayName} ({client.clientCode})</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* STEP INDICATOR */}
          <div className="lg:col-span-1 space-y-1">
            {STEPS.map((step, idx) => (
              <div 
                key={step.id}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  currentStep === idx ? "bg-primary/5 border-primary shadow-sm" : 
                  currentStep > idx ? "bg-slate-50 border-slate-200 opacity-60" : "bg-transparent border-transparent opacity-40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    currentStep === idx ? "bg-primary text-white" : 
                    currentStep > idx ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                  )}>
                    {currentStep > idx ? <CheckCircle className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <div>
                    <p className={cn("text-xs font-bold uppercase tracking-tight", currentStep === idx ? "text-primary" : "text-slate-700")}>{step.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* WIZARD CONTENT */}
          <div className="lg:col-span-3">
            <Card className="min-h-[500px] flex flex-col">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  {STEPS[currentStep].title}
                </CardTitle>
                <CardDescription>{STEPS[currentStep].description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 py-6">
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>What is the reason for this discharge or transition plan?</Label>
                      <Input 
                        placeholder="e.g. Housed via Housing Choice Voucher" 
                        value={answers.reason || ""} 
                        onChange={e => setField("reason", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Plan Type</Label>
                      <Select 
                        value={answers.transitionType} 
                        onValueChange={v => setField("transitionType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned Discharge</SelectItem>
                          <SelectItem value="client_led">Client-Led / Leaving Shelter</SelectItem>
                          <SelectItem value="transfer">Shelter Transfer</SelectItem>
                          <SelectItem value="housing">Housing-Related Transition</SelectItem>
                          <SelectItem value="administrative">Administrative Discharge</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Transition/Discharge Date</Label>
                      <Input 
                        type="date" 
                        value={answers.expectedDate || ""} 
                        onChange={e => setField("expectedDate", e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-4 pt-2">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="clientInvolved" 
                          checked={answers.clientInvolved} 
                          onCheckedChange={v => setField("clientInvolved", !!v)} 
                        />
                        <Label htmlFor="clientInvolved" className="text-sm font-medium leading-none cursor-pointer">Client was involved in planning</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="clientAgrees" 
                          checked={answers.clientAgrees} 
                          onCheckedChange={v => setField("clientAgrees", !!v)} 
                        />
                        <Label htmlFor="clientAgrees" className="text-sm font-medium leading-none cursor-pointer">Client agrees with the documented plan</Label>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>What work has been completed with the client? (Summary of stay)</Label>
                      <Textarea 
                        className="min-h-[150px]" 
                        placeholder="Summarize key assessments, plans, and goals achieved..." 
                        value={answers.caseworkSummary || ""} 
                        onChange={e => setField("caseworkSummary", e.target.value)} 
                      />
                      <p className="text-[10px] text-muted-foreground italic">Include intake, housing plan progress, and primary service connections.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>What work remains outstanding?</Label>
                      <Textarea 
                        className="min-h-[100px]" 
                        placeholder="Pending referrals, document applications, etc." 
                        value={answers.remainingWork || ""} 
                        onChange={e => setField("remainingWork", e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Where is the client transitioning to?</Label>
                      <Input 
                        placeholder="e.g. 123 Main St Apt 4, or Sistering Shelter" 
                        value={answers.destination || ""} 
                        onChange={e => setField("destination", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Destination/Placement Type</Label>
                      <Select 
                        value={answers.destinationType} 
                        onValueChange={v => setField("destinationType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="permanent">Permanent Housing</SelectItem>
                          <SelectItem value="supportive">Supportive Housing</SelectItem>
                          <SelectItem value="transitional">Transitional Housing</SelectItem>
                          <SelectItem value="shelter">Another Shelter</SelectItem>
                          <SelectItem value="family">Family/Friend/Community</SelectItem>
                          <SelectItem value="hospital">Hospital/Health Setting</SelectItem>
                          <SelectItem value="unknown">Unknown/Not Documented</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-3 pt-2">
                      <Checkbox 
                        id="followUpHousingNeeded" 
                        checked={answers.followUpHousingNeeded} 
                        onCheckedChange={v => setField("followUpHousingNeeded", !!v)} 
                      />
                      <Label htmlFor="followUpHousingNeeded" className="text-sm font-medium cursor-pointer">Follow-up housing support needed</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Housing/Destination Notes</Label>
                      <Textarea 
                        placeholder="Move-in tasks, pending viewings, or contact info..." 
                        value={answers.housingNotes || ""} 
                        onChange={e => setField("housingNotes", e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Income and Benefits Status</Label>
                      <Textarea 
                        placeholder="Active benefits, pending applications, or missing income docs..." 
                        value={answers.incomeStatus || ""} 
                        onChange={e => setField("incomeStatus", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Missing Documents (Gaps)</Label>
                      <Input 
                        placeholder="e.g. Birth certificate pending application" 
                        value={answers.missingDocs || ""} 
                        onChange={e => setField("missingDocs", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Basic Needs Supports</Label>
                      <Textarea 
                        placeholder="Food, clothing, or settlement supports needed for transition..." 
                        value={answers.basicNeedsStatus || ""} 
                        onChange={e => setField("basicNeedsStatus", e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Health and Wellness Follow-Ups</Label>
                      <Textarea 
                        placeholder="Doctor appointments, medication management, or medical referrals..." 
                        value={answers.healthFollowUps || ""} 
                        onChange={e => setField("healthFollowUps", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mental Health & Counselling Supports</Label>
                      <Input 
                        placeholder="Active providers or pending referrals..." 
                        value={answers.mentalHealthSupports || ""} 
                        onChange={e => setField("mentalHealthSupports", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Safety Plan Status</Label>
                      <Select 
                        value={answers.safetyPlanStatus} 
                        onValueChange={v => setField("safetyPlanStatus", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active Plan (Transitioning)</SelectItem>
                          <SelectItem value="updated">Updated for Transition</SelectItem>
                          <SelectItem value="closed">Closed - No longer needed</SelectItem>
                          <SelectItem value="none">No safety plan exists</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency/Support Contacts</Label>
                      <Textarea 
                        placeholder="Key family or agency contacts for the transition..." 
                        value={answers.supportContacts || ""} 
                        onChange={e => setField("supportContacts", e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Active Referrals (to carry over)</Label>
                      <Textarea 
                        placeholder="List agencies where client is currently waitlisted or engaged..." 
                        value={answers.activeReferrals || ""} 
                        onChange={e => setField("activeReferrals", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Post-Discharge Follow-Up Actions</Label>
                      <Textarea 
                        placeholder="Who needs to check in? What agency is taking over lead?" 
                        value={answers.followUpActions || ""} 
                        onChange={e => setField("followUpActions", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Important Dates</Label>
                      <Input 
                        placeholder="e.g. Move-in date, First rent due, Follow-up call date" 
                        value={answers.importantDates || ""} 
                        onChange={e => setField("importantDates", e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Client Perspective & Feedback</Label>
                      <Textarea 
                        className="min-h-[150px]"
                        placeholder="What did the client identify as helpful? What are their concerns?" 
                        value={answers.clientPerspective || ""} 
                        onChange={e => setField("clientPerspective", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unresolved Concerns</Label>
                      <Textarea 
                        placeholder="Any items staff or supervisors should be aware of..." 
                        value={answers.unresolvedConcerns || ""} 
                        onChange={e => setField("unresolvedConcerns", e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-bold">Action Steps</Label>
                      <Button variant="outline" size="sm" onClick={addAction}>
                        <Plus className="h-4 w-4 mr-2" /> Add Step
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {answers.actions?.map((action, idx) => (
                        <div key={idx} className="p-4 border rounded-lg bg-slate-50/50 space-y-3 relative">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2 h-7 w-7 p-0 text-slate-400 hover:text-destructive"
                            onClick={() => removeAction(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Action Item</Label>
                              <Input 
                                placeholder="What needs to happen?" 
                                value={action.action} 
                                onChange={e => updateAction(idx, "action", e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Responsible Person</Label>
                              <Select 
                                value={action.responsible} 
                                onValueChange={v => updateAction(idx, "responsible", v as string)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="caseworker">Caseworker</SelectItem>
                                  <SelectItem value="ssa">SSA / Supervisor</SelectItem>
                                  <SelectItem value="housing_worker">Housing Worker</SelectItem>
                                  <SelectItem value="agency">External Agency</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Target Date</Label>
                              <Input 
                                type="date" 
                                value={action.dueDate} 
                                onChange={e => updateAction(idx, "dueDate", e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Follow-Up Date</Label>
                              <Input 
                                type="date" 
                                value={action.followUpDate} 
                                onChange={e => updateAction(idx, "followUpDate", e.target.value)} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!answers.actions || answers.actions.length === 0) && (
                        <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground italic">
                          No action steps added yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-bold border-b pb-1 text-sm uppercase tracking-wider text-slate-500">Logistics</h3>
                        <ReviewItem label="Reason" value={answers.reason} />
                        <ReviewItem label="Type" value={answers.transitionType?.replace('_', ' ')} />
                        <ReviewItem label="Date" value={answers.expectedDate} />
                        <ReviewItem label="Destination" value={answers.destination} />
                        <ReviewItem label="Dest. Type" value={answers.destinationType?.replace('_', ' ')} />
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-bold border-b pb-1 text-sm uppercase tracking-wider text-slate-500">Status</h3>
                        <ReviewItem label="Client Involved" value={answers.clientInvolved ? "Yes" : "No"} />
                        <ReviewItem label="Client Agrees" value={answers.clientAgrees ? "Yes" : "No"} />
                        <ReviewItem label="Housing Support" value={answers.followUpHousingNeeded ? "Yes" : "No"} />
                        <ReviewItem label="Safety Plan" value={answers.safetyPlanStatus} />
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Final Recommendation</h3>
                      <div className="space-y-2">
                        <Label>Recommended Client Status</Label>
                        <Select 
                          value={finalStatus} 
                          onValueChange={(v) => setFinalStatus(v as ClientStatus)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active (No change)</SelectItem>
                            <SelectItem value="follow_up_needed">Follow-Up Support Needed</SelectItem>
                            <SelectItem value="housed">Housed</SelectItem>
                            <SelectItem value="discharged">Discharged</SelectItem>
                            <SelectItem value="inactive">Inactive / Lost Contact</SelectItem>
                            <SelectItem value="transferred">Transferred</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Worker Summary (Final Notes)</Label>
                        <Textarea 
                          placeholder="Brief professional summary for the file..." 
                          value={answers.workerSummary || ""} 
                          onChange={e => setField("workerSummary", e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 9 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-700 font-bold">
                        <CheckCircle className="h-5 w-5" />
                        Plan Generated Successfully
                      </div>
                      <Button variant="outline" size="sm" onClick={copyToClipboardForSmis}>
                        {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <ClipboardCopy className="h-4 w-4 mr-2" />}
                        {copied ? "Copied" : "Copy for SMIS"}
                      </Button>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-lg border font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                      {generatedText}
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-primary text-sm">
                        <LayoutDashboard className="h-4 w-4" /> Final Actions
                      </div>
                      <p className="text-xs text-slate-600">Saving this plan will update the client file, record a timeline event, and update the documentation checklist.</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {finalStatus && (
                          <div className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded uppercase font-bold">
                            Update Status to: {finalStatus}
                          </div>
                        )}
                        {answers.actions && answers.actions.length > 0 && (
                          <div className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded uppercase font-bold">
                            Create {answers.actions.length} Task(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t bg-slate-50/50 flex justify-between py-4">
                <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveDraft}>
                    <Save className="h-4 w-4 mr-2" /> Save Draft
                  </Button>
                  
                  {currentStep === STEPS.length - 1 ? (
                    <Button onClick={handleFinish} disabled={saving}>
                      {saving ? "Saving..." : "Finish Discharge Plan"}
                    </Button>
                  ) : (
                    <Button onClick={nextStep}>
                      Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function ReviewItem({ label, value }: { label: string, value?: string | boolean | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">{label}</span>
      <span className="text-sm font-medium">{value === true ? "Yes" : value === false ? "No" : value || "Not documented"}</span>
    </div>
  );
}
