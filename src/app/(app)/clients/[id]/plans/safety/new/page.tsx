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
import { clientsService } from "@/lib/services/clientsService";
import { generateSafetyPlanText, SafetyPlanAnswers } from "@/lib/casework/safetyPlanGenerator";
import { Client, GeneratedDocument, SupervisorReview } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  ArrowLeft,
  FileText,
  ClipboardCopy,
  LayoutDashboard,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: "reason", title: "Reason for Safety Plan", description: "Why is this plan being created or updated?" },
  { id: "concerns", title: "Client-Identified Concerns", description: "What does the client identify as safety risks?" },
  { id: "warnings", title: "Warning Signs and Triggers", description: "Early indicators of stress or overwhelm." },
  { id: "coping", title: "Coping and De-escalation", description: "Strategies that help the client feel safe." },
  { id: "supports", title: "Supports and Contacts", description: "Trusted people and involved agencies." },
  { id: "staff", title: "Staff Support Plan", description: "Instructions for staff to support the client." },
  { id: "followup", title: "Follow-Up and Review", description: "Next steps and review timelines." },
  { id: "review", title: "Review", description: "Verify all information before finalizing." },
  { id: "finish", title: "Finish", description: "Generate and save SMIS-ready documentation." }
];

export default function NewSafetyPlanPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [client, setClient] = useState<Client | null>(null);
  const [answers, setAnswers] = useState<SafetyPlanAnswers>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(`safety_plan_draft_${id}`);
    return raw ? JSON.parse(raw) : {};
  });
  const [generatedText, setGeneratedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  const storageKey = useMemo(() => `safety_plan_draft_${id}`, [id]);

  useEffect(() => {
    if (!user || !id) return;
    clientsService.getClientById(id, { 
      id: user.id, 
      organizationId: user.organizationId, 
      role: user.role, 
      siteIds: user.siteIds,
      firstName: user.firstName,
      lastName: user.lastName,
    }).then(setClient);
  }, [id, user]);

  const setField = (key: keyof SafetyPlanAnswers, value: any) => {
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
      // Moving to finish step
      if (client && user) {
        const text = generateSafetyPlanText(client, `${user.firstName} ${user.lastName}`, client.siteId, answers);
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

  const finalizePlan = () => {
    const actor = getDemoActor();
    if (!actor || !client) return;

    setSaving(true);
    try {
      const savedDoc = completeDemoGeneratedDocumentWorkflow({
        client,
        actor,
        documentType: "safety_plan",
        title: `Safety Plan - ${client.displayName}`,
        generatedText,
        sourceAnswers: answers,
        relatedWorkstreamType: "safety",
        checklistUpdates: { safetyPlanCompleted: true },
        reviewDate: answers.reviewDate,
        createTask: answers.createTask === "yes",
        taskData: {
          title: `Safety Follow-up: ${answers.nextAction || "General Safety Review"}`,
          description: "Follow-up required from safety plan completion.",
          dueDate: answers.dueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "high"
        },
        supervisorReviewRequested: answers.requestSupervisorReview === "yes" || answers.supervisorReviewRequired === "yes"
      });

      setSavedDocId(savedDoc.id);

      // Clear draft
      window.localStorage.removeItem(storageKey);

      toast.success("Safety Plan saved to client file");
      router.push(`/clients/${client.id}?tab=plans&success=safety_plan_saved`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save safety plan");
    } finally {
      setSaving(false);
    }
  };

  if (!client) return <div className="p-8 text-center">Loading safety wizard...</div>;

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "reason":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What is the main reason for creating or updating this safety plan?</Label>
              <Select value={answers.reason} onValueChange={v => setField("reason", v)}>
                <SelectTrigger><SelectValue placeholder="Select primary reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_requested">Client requested support</SelectItem>
                  <SelectItem value="staff_identified">Staff identified safety concern</SelectItem>
                  <SelectItem value="recent_incident">Recent conflict or incident</SelectItem>
                  <SelectItem value="vulnerability">Vulnerability concern</SelectItem>
                  <SelectItem value="health_medical">Health or medical concern</SelectItem>
                  <SelectItem value="mental_health">Mental health-related concern</SelectItem>
                  <SelectItem value="substance_use">Substance use-related concern</SelectItem>
                  <SelectItem value="placement_concern">Housing/shelter placement concern</SelectItem>
                  <SelectItem value="review">Review of existing plan</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Is this a review/update?</Label>
                <Select value={answers.isUpdate} onValueChange={v => setField("isUpdate", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="no">No, new plan</SelectItem><SelectItem value="yes">Yes, review/update</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client involved in development?</Label>
                <Select value={answers.clientInvolved} onValueChange={v => setField("clientInvolved", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Does client agree with plan?</Label>
                <Select value={answers.clientAgreed} onValueChange={v => setField("clientAgreed", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="partial">Partially</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supervisor review required?</Label>
                <Select value={answers.supervisorReviewRequired} onValueChange={v => setField("supervisorReviewRequired", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case "concerns":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What safety concerns did the client identify?</Label>
              <Textarea 
                placeholder="Document client's perspective on safety risks in professional, non-graphic language." 
                value={answers.clientConcerns || ""} 
                onChange={e => setField("clientConcerns", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Any people, places, or situations to avoid?</Label>
              <Textarea value={answers.avoidSituations || ""} onChange={e => setField("avoidSituations", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Any immediate concerns staff should be aware of?</Label>
              <Input value={answers.immediateConcerns || ""} onChange={e => setField("immediateConcerns", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What does the client say would help them feel safer?</Label>
              <Textarea value={answers.whatHelpsSafety || ""} onChange={e => setField("whatHelpsSafety", e.target.value)} />
            </div>
          </div>
        );
      case "warnings":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What warning signs or early indicators did the client identify?</Label>
              <Textarea placeholder="e.g. Withdrawal, increased volume, difficulty focusing" value={answers.warningSigns || ""} onChange={e => setField("warningSigns", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What situations may increase stress, conflict, or vulnerability?</Label>
              <Textarea value={answers.stressSituations || ""} onChange={e => setField("stressSituations", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What does the client notice in themselves when overwhelmed?</Label>
              <Input value={answers.overwhelmedIndicators || ""} onChange={e => setField("overwhelmedIndicators", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What should staff watch for, based on what the client shared?</Label>
              <Textarea value={answers.staffWatchFor || ""} onChange={e => setField("staffWatchFor", e.target.value)} />
            </div>
          </div>
        );
      case "coping":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What coping strategies does the client say help them?</Label>
              <Textarea placeholder="e.g. Taking a walk, listening to music, quiet space" value={answers.copingStrategies || ""} onChange={e => setField("copingStrategies", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What activities, spaces, or supports help the client feel safer?</Label>
              <Textarea value={answers.helpfulSupports || ""} onChange={e => setField("helpfulSupports", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What approaches from staff are helpful?</Label>
              <Input placeholder="e.g. Low voice, giving space, clear instructions" value={answers.helpfulStaffApproaches || ""} onChange={e => setField("helpfulStaffApproaches", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What approaches should staff avoid?</Label>
              <Input placeholder="e.g. Touching, sudden movements, loud tone" value={answers.approachesToAvoid || ""} onChange={e => setField("approachesToAvoid", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Preferred communication method?</Label>
              <Input value={answers.preferredCommunication || ""} onChange={e => setField("preferredCommunication", e.target.value)} />
            </div>
          </div>
        );
      case "supports":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trusted supports (Family, friends, community)?</Label>
              <Textarea value={answers.trustedSupports || ""} onChange={e => setField("trustedSupports", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Involved agencies or community supports?</Label>
              <Input value={answers.agenciesInvolved || ""} onChange={e => setField("agenciesInvolved", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Health, mental health, or harm reduction supports?</Label>
              <Input value={answers.healthSupports || ""} onChange={e => setField("healthSupports", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Emergency or support contacts documented?</Label>
              <Input placeholder="e.g. Not provided, or specific names" value={answers.emergencyContacts || ""} onChange={e => setField("emergencyContacts", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Does client want staff to help connect with supports?</Label>
              <Select value={answers.staffConnectRequest} onValueChange={v => setField("staffConnectRequest", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        );
      case "staff":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Steps if client appears distressed, unsafe, or overwhelmed?</Label>
              <Textarea placeholder="Specific de-escalation or support steps for staff." value={answers.staffDistressSteps || ""} onChange={e => setField("staffDistressSteps", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Immediate first steps for staff?</Label>
              <Input placeholder="Primary action staff should take." value={answers.staffFirstSteps || ""} onChange={e => setField("staffFirstSteps", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>When should staff notify a supervisor?</Label>
              <Input placeholder="Clear criteria for escalation." value={answers.supervisorNotification || ""} onChange={e => setField("supervisorNotification", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Specific safety or communication approaches for staff?</Label>
              <Textarea value={answers.specificCommunicationApproaches || ""} onChange={e => setField("specificCommunicationApproaches", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Environmental changes that may help?</Label>
              <Input placeholder="e.g. Quiet area access, lower lighting" value={answers.environmentalChanges || ""} onChange={e => setField("environmentalChanges", e.target.value)} />
            </div>
          </div>
        );
      case "followup":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Next safety-related follow-up action?</Label>
              <Textarea value={answers.nextAction || ""} onChange={e => setField("nextAction", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsible person</Label>
                <Select value={answers.responsible} onValueChange={v => setField("responsible", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="caseworker">Caseworker</SelectItem>
                    <SelectItem value="ssa">SSA / Supervisor</SelectItem>
                    <SelectItem value="counsellor">Counsellor</SelectItem>
                    <SelectItem value="external">External Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Review date</Label>
                <Input type="date" value={answers.reviewDate || ""} onChange={e => setField("reviewDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Create task in CaseBridge?</Label>
                <Select value={answers.createTask} onValueChange={v => setField("createTask", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Request Supervisor Review?</Label>
                <Select value={answers.requestSupervisorReview} onValueChange={v => setField("requestSupervisorReview", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case "review":
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="p-4 bg-muted/50 rounded-lg space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b pb-2">
                <div><p className="text-muted-foreground font-semibold">Reason</p><p className="capitalize">{answers.reason?.replace("_", " ")}</p></div>
                <div><p className="text-muted-foreground font-semibold">Involved</p><p>{answers.clientInvolved === "yes" ? "Yes" : "No"}</p></div>
              </div>
              <div><p className="text-muted-foreground font-semibold">Main Concerns</p><p className="line-clamp-2">{answers.clientConcerns || "N/A"}</p></div>
              <div><p className="text-muted-foreground font-semibold">Staff Plan</p><p className="line-clamp-2">{answers.staffFirstSteps || "N/A"}</p></div>
              <div className="grid grid-cols-2 gap-4 border-t pt-2">
                <div><p className="text-muted-foreground font-semibold">Review Date</p><p>{answers.reviewDate || "N/A"}</p></div>
                <div><p className="text-muted-foreground font-semibold">Supervisor Review</p><p>{answers.requestSupervisorReview === "yes" ? "Requested" : "No"}</p></div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">Click "Finish Safety Plan" to generate documentation.</p>
          </div>
        );
      case "finish":
        return (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" /> SMIS-Ready Safety Plan
                  </h4>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <ClipboardCopy className="h-4 w-4 mr-2" /> {copied ? "Copied!" : "Copy for SMIS"}
                  </Button>
                </div>
                <Textarea 
                  value={generatedText} 
                  readOnly 
                  className="min-h-[400px] font-mono text-xs leading-relaxed bg-white border-primary/10"
                />
              </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={finalizePlan} 
                className="flex-1 h-12 text-lg" 
                disabled={saving}
              >
                <Save className="h-5 w-5 mr-2" /> {saving ? "Saving..." : "Save to Client File"}
              </Button>
              <Link 
                href={`/clients/${client.id}`} 
                className={buttonVariants({ variant: "outline", className: "flex-1 h-12" })}
              >
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
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Safety Plan Wizard</h2>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
          <Link href={`/clients/${id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to File
          </Link>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
          {STEPS.map((s, idx) => (
            <div 
              key={s.id} 
              className={cn(
                "h-full flex-1 transition-all duration-300",
                idx <= currentStep ? "bg-primary" : "bg-muted",
                idx === currentStep ? "opacity-100" : "opacity-40",
                idx < currentStep ? "border-r border-background/20" : ""
              )}
            />
          ))}
        </div>

        {/* STEP CONTENT */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {currentStep + 1}
                </div>
                <div>
                  <CardTitle className="text-lg">{STEPS[currentStep].title}</CardTitle>
                  <CardDescription className="text-xs">Step {currentStep + 1} of {STEPS.length}</CardDescription>
                </div>
              </div>
              {currentStep < STEPS.length - 1 && (
                <Button variant="outline" size="sm" onClick={saveDraft}>
                  <Save className="h-4 w-4 mr-2" /> Save Draft
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
          
          {/* NAVIGATION */}
          {currentStep < STEPS.length - 1 && (
            <div className="p-6 border-t bg-muted/10 flex justify-between">
              <Button 
                variant="ghost" 
                onClick={prevStep} 
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              
              {currentStep === STEPS.length - 2 ? (
                <Button onClick={nextStep} className="bg-primary hover:bg-primary/90">
                  Finish Safety Plan <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}
