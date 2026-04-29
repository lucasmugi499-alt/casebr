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
import { generateHousingPlanText, HousingPlanAnswers } from "@/lib/casework/housingPlanGenerator";
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
  { id: "goal", title: "Housing Goal", description: "What is the client's long-term housing vision?" },
  { id: "situation", title: "Current Housing Situation", description: "Details about the client's homelessness history." },
  { id: "income", title: "Income and Affordability", description: "Financial capacity and benefits status." },
  { id: "docs", title: "Identification and Documents", description: "Checklist of required documentation." },
  { id: "apps", title: "Applications and Referrals", description: "Existing agency connections and housing waitlists." },
  { id: "barriers", title: "Barriers to Housing", description: "Challenges affecting housing placement." },
  { id: "strengths", title: "Strengths and Supports", description: "Positive attributes and community connections." },
  { id: "action", title: "Action Plan", description: "Next steps, responsibilities, and timelines." },
  { id: "review", title: "Review", description: "Verify all information before finalizing." },
  { id: "finish", title: "Finish", description: "Generate and save SMIS-ready documentation." }
];

export default function NewHousingPlanPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [client, setClient] = useState<Client | null>(null);
  const [answers, setAnswers] = useState<HousingPlanAnswers>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(`housing_plan_draft_${id}`);
    return raw ? JSON.parse(raw) : {};
  });
  const [generatedText, setGeneratedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  const storageKey = useMemo(() => `housing_plan_draft_${id}`, [id]);

  useEffect(() => {
    if (!user || !id) return;
    clientsService.getClientById(id, { 
      id: user.id, 
      organizationId: user.organizationId, 
      role: user.role, 
      siteIds: user.siteIds,
      firstName: user.firstName,
      lastName: user.lastName
    }).then(setClient);
  }, [id, user]);

  const setField = (key: keyof HousingPlanAnswers, value: any) => {
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
      // Moving to finish step
      if (client && user) {
        const text = generateHousingPlanText(client, `${user.firstName} ${user.lastName}`, client.siteId, answers);
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
        documentType: "housing_plan",
        title: `Housing Plan - ${client.displayName}`,
        generatedText,
        sourceAnswers: answers,
        relatedWorkstreamType: "housing",
        checklistUpdates: { housingPlanStarted: true },
        createTask: answers.createTask === "yes",
        taskData: {
          title: answers.nextAction || "Housing Plan Follow-up",
          description: "Follow-up from housing plan completion.",
          dueDate: answers.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "high"
        }
      });

      setSavedDocId(savedDoc.id);

      // Clear draft
      window.localStorage.removeItem(storageKey);

      toast.success("Housing Plan saved to client file");
      router.push(`/clients/${client.id}?tab=plans&success=housing_plan_saved`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save Housing Plan");
    } finally {
      setSaving(false);
    }
  };

  if (!client) return <div className="p-8 text-center">Loading wizard...</div>;

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "goal":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What is the client’s current housing goal?</Label>
              <Textarea 
                placeholder="e.g. Seeking independent subsidized apartment in downtown core." 
                value={answers.housingGoal || ""} 
                onChange={e => setField("housingGoal", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>What type of housing is the client seeking?</Label>
              <Select value={answers.housingType} onValueChange={v => setField("housingType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select housing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent_housing">Independent Housing</SelectItem>
                  <SelectItem value="supportive_housing">Supportive Housing</SelectItem>
                  <SelectItem value="transitional_housing">Transitional Housing</SelectItem>
                  <SelectItem value="rooming_house">Rooming House</SelectItem>
                  <SelectItem value="family_reunification">Family Reunification</SelectItem>
                  <SelectItem value="shelter_transfer">Shelter Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred location or area?</Label>
              <Input value={answers.locationPreference || ""} onChange={e => setField("locationPreference", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Any accessibility needs?</Label>
              <Input placeholder="e.g. Main floor, elevator, no stairs" value={answers.accessibilityNeeds || ""} onChange={e => setField("accessibilityNeeds", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Any safety or location concerns?</Label>
              <Input placeholder="Areas to avoid or specific safety requirements" value={answers.safetyConcerns || ""} onChange={e => setField("safetyConcerns", e.target.value)} />
            </div>
          </div>
        );
      case "situation":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Where is the client currently staying?</Label>
              <Input value={answers.currentStay || ""} onChange={e => setField("currentStay", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>How long has the client been in shelter?</Label>
              <Input value={answers.shelterDuration || ""} onChange={e => setField("shelterDuration", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What led to current homelessness or housing instability?</Label>
              <Textarea value={answers.housingInstabilityReason || ""} onChange={e => setField("housingInstabilityReason", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Has the client had recent housing?</Label>
              <Input placeholder="Last stable address or situation" value={answers.previousHousing || ""} onChange={e => setField("previousHousing", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What caused the last housing to end?</Label>
              <Input value={answers.previousHousingEnd || ""} onChange={e => setField("previousHousingEnd", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Is the client at risk of losing a placement or shelter bed?</Label>
              <Select value={answers.riskOfLoss} onValueChange={v => setField("riskOfLoss", v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No - Stable placement</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="moderate">Moderate Risk</SelectItem>
                  <SelectItem value="high">High Risk - Discharge pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "income":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Does the client have income?</Label>
              <Select value={answers.hasIncome} onValueChange={v => setField("hasIncome", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="pending">Pending Application</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Income source</Label>
              <Select value={answers.incomeSource} onValueChange={v => setField("incomeSource", v)}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OW">OW</SelectItem>
                  <SelectItem value="ODSP">ODSP</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="pension">Pension</SelectItem>
                  <SelectItem value="EI">EI</SelectItem>
                  <SelectItem value="no_income">No Income</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly income amount (if known)</Label>
              <Input placeholder="$" value={answers.monthlyIncome || ""} onChange={e => setField("monthlyIncome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Does the client need support applying for income benefits?</Label>
              <Select value={answers.benefitSupportNeeded} onValueChange={v => setField("benefitSupportNeeded", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Has bank account?</Label>
                <Select value={answers.hasBankAccount} onValueChange={v => setField("hasBankAccount", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Has proof of income?</Label>
                <Select value={answers.proofOfIncome} onValueChange={v => setField("proofOfIncome", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case "docs":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Select "Yes" for documents currently in the client's possession.</p>
            {[
              { id: "hasGovernmentId", label: "Government ID" },
              { id: "hasHealthCard", label: "Health Card" },
              { id: "hasSIN", label: "SIN" },
              { id: "hasBirthCert", label: "Birth Certificate" },
              { id: "hasProofOfIncome", label: "Proof of Income" },
              { id: "hasNoticeOfAssessment", label: "Notice of Assessment" },
            ].map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md">
                <Label className="font-medium">{doc.label}</Label>
                <Select value={(answers as any)[doc.id]} onValueChange={v => setField(doc.id as any, v)}>
                  <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="requested">Requested</SelectItem></SelectContent>
                </Select>
              </div>
            ))}
            <div className="space-y-2 pt-2">
              <Label>Which documents are missing?</Label>
              <Input value={answers.missingDocuments || ""} onChange={e => setField("missingDocuments", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What document support is needed?</Label>
              <Input value={answers.documentSupportNeeded || ""} onChange={e => setField("documentSupportNeeded", e.target.value)} />
            </div>
          </div>
        );
      case "apps":
        return (
          <div className="space-y-4">
             <div className="space-y-2">
              <Label>Has a housing application already been started?</Label>
              <Select value={answers.applicationsStarted} onValueChange={v => setField("applicationsStarted", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Applied for subsidized housing?</Label>
                <Select value={answers.subsidizedHousing} onValueChange={v => setField("subsidizedHousing", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Applied for supportive housing?</Label>
                <Select value={answers.supportiveHousing} onValueChange={v => setField("supportiveHousing", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Referred to a housing worker or agency?</Label>
              <Select value={answers.housingWorkerReferral} onValueChange={v => setField("housingWorkerReferral", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Which agencies are involved?</Label>
              <Input placeholder="e.g. Access Housing, Main St Housing" value={answers.agenciesInvolved || ""} onChange={e => setField("agenciesInvolved", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Are there pending applications?</Label>
              <Input value={answers.pendingApplications || ""} onChange={e => setField("pendingApplications", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Upcoming housing appointments or viewings?</Label>
              <Input value={answers.upcomingAppointments || ""} onChange={e => setField("upcomingAppointments", e.target.value)} />
            </div>
          </div>
        );
      case "barriers":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What barriers are affecting housing?</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {["income", "id_documents", "rental_arrears", "credit_history", "mental_health", "substance_use", "legal_issues", "discrimination", "accessibility", "family_conflict", "safety_concerns", "lack_of_references"].map(b => (
                  <label key={b} className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(answers.barriers as string[] || []).includes(b)}
                      onChange={e => {
                        const current = answers.barriers as string[] || [];
                        if (e.target.checked) setField("barriers", [...current, b]);
                        else setField("barriers", current.filter(x => x !== b));
                      }}
                    />
                    <span className="capitalize">{b.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label>What does the client identify as their main barrier?</Label>
              <Input value={answers.mainBarrier || ""} onChange={e => setField("mainBarrier", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What support would help reduce these barriers?</Label>
              <Textarea value={answers.barrierSupport || ""} onChange={e => setField("barrierSupport", e.target.value)} />
            </div>
          </div>
        );
      case "strengths":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What strengths does the client identify?</Label>
              <Textarea placeholder="e.g. Resourceful, motivated, strong family ties" value={answers.strengths || ""} onChange={e => setField("strengths", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Family, friends, or community supports?</Label>
              <Textarea value={answers.communitySupports || ""} onChange={e => setField("communitySupports", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Is the client connected to any agencies?</Label>
              <Input value={answers.agencyConnections || ""} onChange={e => setField("agencyConnections", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Is the client willing to work with a housing worker?</Label>
              <Select value={answers.willingHousingWorker} onValueChange={v => setField("willingHousingWorker", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>What has worked for the client in the past?</Label>
              <Textarea value={answers.workedBefore || ""} onChange={e => setField("workedBefore", e.target.value)} />
            </div>
          </div>
        );
      case "action":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What is the next housing action?</Label>
              <Textarea placeholder="Specific, measurable next step" value={answers.nextAction || ""} onChange={e => setField("nextAction", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Who is responsible?</Label>
              <Select value={answers.responsible} onValueChange={v => setField("responsible", v)}>
                <SelectTrigger><SelectValue placeholder="Select responsible party" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="caseworker">Caseworker</SelectItem>
                  <SelectItem value="housing_worker">Housing Worker</SelectItem>
                  <SelectItem value="external_agency">External Agency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input type="date" value={answers.dueDate || ""} onChange={e => setField("dueDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Follow-up date</Label>
                <Input type="date" value={answers.followUpDate || ""} onChange={e => setField("followUpDate", e.target.value)} />
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
                <Label>Client agree with this plan?</Label>
                <Select value={answers.clientAgreement} onValueChange={v => setField("clientAgreement", v)}>
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
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground font-semibold">Goal</p><p>{answers.housingGoal || "N/A"}</p></div>
                <div><p className="text-muted-foreground font-semibold">Type</p><p className="capitalize">{answers.housingType?.replace("_", " ")}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground font-semibold">Income</p><p>{answers.incomeSource} ({answers.monthlyIncome || "N/A"})</p></div>
                <div><p className="text-muted-foreground font-semibold">Current Stay</p><p>{answers.currentStay || "N/A"}</p></div>
              </div>
              <div><p className="text-muted-foreground font-semibold">Main Barrier</p><p>{answers.mainBarrier || "N/A"}</p></div>
              <div><p className="text-muted-foreground font-semibold">Next Action</p><p>{answers.nextAction || "N/A"}</p></div>
            </div>
            <p className="text-center text-xs text-muted-foreground">Click "Finish Plan" to generate the SMIS-ready document.</p>
          </div>
        );
      case "finish":
        return (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <FileText className="h-5 w-5" /> SMIS-Ready Housing Plan
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
            <h2 className="text-2xl font-bold tracking-tight">Housing Plan Wizard</h2>
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
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step {currentStep + 1} of {STEPS.length}</span>
                <CardTitle className="mt-1">{STEPS[currentStep].title}</CardTitle>
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
                  Finish Plan <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* SUMMARY CARD IN SIDEBAR (Optional, keeping it simple for now) */}
      </div>
    </AuthGuard>
  );
}
