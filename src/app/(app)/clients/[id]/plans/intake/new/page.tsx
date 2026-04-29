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
import { generateIntakeAssessmentText, IntakeAssessmentAnswers } from "@/lib/casework/intakePlanGenerator";
import { Client, GeneratedDocument } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  ArrowLeft,
  FileText,
  ClipboardCopy,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { id: "consent", title: "Consent & Privacy", description: "Mandatory agreements for shelter stay." },
  { id: "identity", title: "Identity & ID", description: "Legal identity and documentation status." },
  { id: "housing", title: "Housing History", description: "Current homelessness situation and history." },
  { id: "needs", title: "Priorities", description: "Identifying immediate needs and risks." },
  { id: "finish", title: "Finalize Intake", description: "Generate and save SMIS-ready documentation." }
];

export default function NewIntakeAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [client, setClient] = useState<Client | null>(null);
  const [answers, setAnswers] = useState<IntakeAssessmentAnswers>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(`intake_draft_${id}`);
    return raw ? JSON.parse(raw) : { priorityNeeds: [] };
  });
  const [generatedText, setGeneratedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  const storageKey = useMemo(() => `intake_draft_${id}`, [id]);

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

  const setField = (key: keyof IntakeAssessmentAnswers, value: any) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const saveDraft = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  };

  const nextStep = () => {
    saveDraft();
    if (currentStep === STEPS.length - 2) {
      if (client && user) {
        const text = generateIntakeAssessmentText(client, `${user.firstName} ${user.lastName}`, "Metro Shelter Main", answers);
        setGeneratedText(text);
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const finalizeIntake = () => {
    const actor = getDemoActor();
    if (!actor || !client) return;

    setSaving(true);
    try {
      const clientNeedsData = answers.priorityNeeds?.map(needType => ({
        needType: needType as any,
        priority: "high" as const,
        status: "identified" as const,
        recommendedNextAction: `Address ${needType.replace("_", " ")} identified during intake.`,
      })) || [];

      const savedDoc = completeDemoGeneratedDocumentWorkflow({
        client,
        actor,
        documentType: "intake_assessment",
        title: `Intake Assessment - ${client.displayName}`,
        generatedText,
        sourceAnswers: answers,
        checklistUpdates: { 
          intakeCompleted: true,
          consentCompleted: answers.consentSigned || false,
          privacyExplained: answers.privacyExplained || false
        },
        statusUpdate: client.status === "intake" ? "active" : undefined,
        createClientNeeds: clientNeedsData.length > 0,
        clientNeedsData: clientNeedsData
      });

      setSavedDocId(savedDoc.id);

      // Clear draft
      window.localStorage.removeItem(storageKey);

      toast.success("Intake Assessment saved to client file");
      router.push(`/clients/${client.id}?tab=plans&success=intake_completed`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save intake assessment");
    } finally {
      setSaving(false);
    }
  };

  if (!client) return <div className="p-8 text-center">Loading wizard...</div>;

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "consent":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="consent" 
                  checked={answers.consentSigned} 
                  onCheckedChange={v => setField("consentSigned", !!v)} 
                />
                <div className="space-y-1">
                  <Label htmlFor="consent" className="text-sm font-bold leading-none cursor-pointer">Signed Consent to Share Information</Label>
                  <p className="text-xs text-muted-foreground">Client has signed the multi-agency consent form for service coordination.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="privacy" 
                  checked={answers.privacyExplained} 
                  onCheckedChange={v => setField("privacyExplained", !!v)} 
                />
                <div className="space-y-1">
                  <Label htmlFor="privacy" className="text-sm font-bold leading-none cursor-pointer">Privacy Policy Explained</Label>
                  <p className="text-xs text-muted-foreground">The shelter privacy policy and client rights have been explained and provided in writing.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Caseworker Observation (Optional)</Label>
              <Textarea 
                placeholder="Any immediate concerns or observations regarding the consent process?" 
                value={answers.consentNotes || ""} 
                onChange={e => setField("consentNotes", e.target.value)}
              />
            </div>
          </div>
        );
      case "identity":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Legal First Name</Label>
                <Input value={answers.legalFirstName || ""} onChange={e => setField("legalFirstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Legal Last Name</Label>
                <Input value={answers.legalLastName || ""} onChange={e => setField("legalLastName", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={answers.dateOfBirth || ""} onChange={e => setField("dateOfBirth", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SIN (Optional)</Label>
                <Input placeholder="000-000-000" value={answers.sin || ""} onChange={e => setField("sin", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Health Card Number</Label>
              <Input placeholder="0000-000-000-XX" value={answers.healthCardNumber || ""} onChange={e => setField("healthCardNumber", e.target.value)} />
            </div>
          </div>
        );
      case "housing":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Reason for Homelessness</Label>
              <Select value={answers.homelessnessReason} onValueChange={v => setField("homelessnessReason", v)}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eviction">Eviction</SelectItem>
                  <SelectItem value="family_conflict">Family / Relationship Conflict</SelectItem>
                  <SelectItem value="violence">Domestic Violence</SelectItem>
                  <SelectItem value="financial">Financial Hardship / Job Loss</SelectItem>
                  <SelectItem value="mental_health">Mental Health / Substance Use</SelectItem>
                  <SelectItem value="transfer">Transfer from another shelter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Last Stable Housing Address</Label>
              <Textarea 
                placeholder="Include city and province..." 
                value={answers.lastStableHousing || ""} 
                onChange={e => setField("lastStableHousing", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>How long has the client been unhoused?</Label>
              <Input placeholder="e.g. 2 months, 3 years" value={answers.unhousedDuration || ""} onChange={e => setField("unhousedDuration", e.target.value)} />
            </div>
          </div>
        );
      case "needs":
        return (
          <div className="space-y-4">
            <Label>Identify High Priority Needs (Select all that apply)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: "housing_support", label: "Housing Support" },
                { id: "income_support", label: "Income / Benefits" },
                { id: "health_wellness", label: "Health / Wellness" },
                { id: "safety_planning", label: "Safety Planning" },
                { id: "legal_support", label: "Legal / Immigration" },
                { id: "employment_education", label: "Employment / Education" }
              ].map(need => (
                <div key={need.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/30 cursor-pointer">
                  <Checkbox 
                    id={need.id} 
                    checked={answers.priorityNeeds?.includes(need.id)} 
                    onCheckedChange={v => {
                      const current = answers.priorityNeeds || [];
                      if (v) setField("priorityNeeds", [...current, need.id]);
                      else setField("priorityNeeds", current.filter(id => id !== need.id));
                    }} 
                  />
                  <Label htmlFor={need.id} className="text-sm font-medium leading-none cursor-pointer">{need.label}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-4">
              <Label>Recommended Next Step</Label>
              <Input placeholder="e.g. Start Housing Plan, Refer to Mental Health support" value={answers.nextAction || ""} onChange={e => setField("nextAction", e.target.value)} />
            </div>
          </div>
        );
      case "finish":
        return (
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <h4 className="font-bold text-primary flex items-center gap-2">
                <FileText className="h-5 w-5" /> SMIS-Ready Intake Assessment
              </h4>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(generatedText);
                setCopied(true);
                toast.success("Copied for SMIS");
                
                const actor = getDemoActor();
                if (actor && client && savedDocId) {
                  copyDemoDocumentToSmis(client.id, savedDocId, actor);
                }
                
                setTimeout(() => setCopied(false), 2000);
              }}>
                <ClipboardCopy className="h-4 w-4 mr-2" /> {copied ? "Copied!" : "Copy for SMIS"}
              </Button>
            </div>
            <Textarea 
              value={generatedText} 
              readOnly 
              className="min-h-[350px] font-mono text-[11px] leading-relaxed bg-slate-50 border-primary/10"
            />
            <div className="flex gap-3 pt-2">
               <Button onClick={finalizeIntake} className="flex-1 h-12" disabled={saving}>
                 <Save className="h-5 w-5 mr-2" /> {saving ? "Saving..." : "Finalize & Save to File"}
               </Button>
               <Link href={`/clients/${client.id}`} className={buttonVariants({ variant: "outline", className: "flex-1 h-12" })}>
                 Cancel
               </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa"]}>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Client Intake Assessment</h2>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
          <Link href={`/clients/${id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Exit Wizard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {STEPS.map((s, idx) => (
              <div 
                key={s.id} 
                className={cn(
                  "p-3 rounded-lg border text-sm transition-all",
                  idx === currentStep ? "bg-primary text-white border-primary shadow-md" : 
                  idx < currentStep ? "bg-green-50 border-green-200 text-green-700" : "bg-muted/30 border-transparent text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                    idx === currentStep ? "bg-white text-primary border-white" : 
                    idx < currentStep ? "bg-green-600 text-white border-green-600" : "bg-muted text-muted-foreground border-muted-foreground/20"
                  )}>
                    {idx < currentStep ? <CheckCircle className="h-3 w-3" /> : idx + 1}
                  </div>
                  <span className="font-medium">{s.title}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="bg-muted/20 border-b">
                <CardTitle className="text-lg">Step {currentStep + 1}: {STEPS[currentStep].title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {renderStep()}
              </CardContent>
              {currentStep < STEPS.length - 1 && (
                <CardFooter className="bg-muted/10 border-t justify-between p-4">
                  <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                  <Button onClick={nextStep}>
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
