"use client";

import AuthGuard from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getDemoDocumentChecklistForClient, 
  getDemoDocumentationChecklistForClient, 
  getDemoGeneratedDocumentsForClient, 
  getDemoNeedsForClient, 
  getDemoTimelineForClient, 
  getDemoWorkstreamsForClient,
  getDemoClientById,
  getDemoNotesForClient,
  getDemoTasksForClient,
  getDemoReferralsForClient,
  getDemoRiskFlagsForClient,
  getDemoSafetyPlansForClient
} from "@/lib/demo/demoServices";
import { isDemoMode } from "@/lib/demo/demoMode";
import { updateDemoDocumentationChecklist } from "@/lib/demo/demoStore";
import { CaseNote, Client, ClientNeed, DocumentChecklist, DocumentationChecklist, GeneratedDocument, Referral, RiskFlag, SafetyPlan, Task, TimelineItem, Workstream } from "@/types";
import { 
  AlertTriangle, 
  ClipboardCheck, 
  FileText, 
  Plus, 
  Calendar, 
  User, 
  MapPin, 
  Target, 
  Clock, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  History,
  ShieldAlert,
  Sparkles,
  ClipboardCopy,
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "overview";
  const successParam = searchParams.get("success");

  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [safetyPlans, setSafetyPlans] = useState<SafetyPlan[]>([]);
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [needs, setNeeds] = useState<ClientNeed[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [documentationChecklist, setDocumentationChecklist] = useState<DocumentationChecklist | null>(null);
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklist | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!user || !id) return;

    const actor: any = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
      siteIds: user.siteIds,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const loadData = async () => {
      setLoading(true);
      try {
        if (isDemoMode()) {
          const c = getDemoClientById(id, actor);
          setClient(c);
          if (c) {
            setWorkstreams(getDemoWorkstreamsForClient(id));
            setNeeds(getDemoNeedsForClient(id));
            setDocuments(getDemoGeneratedDocumentsForClient(id));
            setDocumentationChecklist(getDemoDocumentationChecklistForClient(id));
            setDocumentChecklist(getDemoDocumentChecklistForClient(id));
            setTimeline(getDemoTimelineForClient(id));
            setNotes(getDemoNotesForClient(id));
            setTasks(getDemoTasksForClient(id));
            setReferrals(getDemoReferralsForClient(id));
            setRiskFlags(getDemoRiskFlagsForClient(id));
            setSafetyPlans(getDemoSafetyPlansForClient(id));
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  useEffect(() => {
    if (successParam) {
      const messages: Record<string, string> = {
        housing_plan_saved: "Housing Plan has been saved and documented.",
        safety_plan_saved: "Safety Plan has been saved and documented.",
        service_plan_saved: "Service Plan has been updated.",
        intake_completed: "Intake Assessment completed successfully.",
        note_saved: "Case note added to client record.",
        checklist_saved: "Document checklist updated."
      };

      if (messages[successParam]) {
        toast.success(messages[successParam]);
      }

      // Clear the success param from URL without refreshing
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [successParam, pathname, router, searchParams]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading client work file...</div>;
  if (!client) return <div className="p-8 text-center">Client not found or access denied.</div>;

  const activeRisk = riskFlags.filter(f => f.active);
  const openTasks = tasks.filter(t => t.status !== "completed");
  const pendingReferrals = referrals.filter(r => ["pending", "no_response"].includes(r.status));
  const overdueTasks = tasks.filter(t => t.status !== "completed" && new Date(t.dueDate).getTime() < nowMs);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "follow_up_needed": return "bg-amber-100 text-amber-800 border-amber-200";
      case "housed": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const nextBestActions: { text: string; action?: string; link?: string }[] = [];
  const housingNeed = needs.find(n => n.needType === "housing_support");
  const safetyNeed = needs.find(n => n.needType === "safety_planning");
  const serviceNeed = needs.find(n => n.needType === "service_planning");
  const hasHousingPlan = documents.some(d => d.type === "housing_plan");
  const hasSafetyPlan = documents.some(d => d.type === "safety_plan");
  const hasServicePlan = documents.some(d => d.type === "service_plan");
  const safetyPlan = documents.find(d => d.type === "safety_plan");
  const servicePlan = documents.find(d => d.type === "service_plan");
  const isSafetyReviewDue = safetyPlan && (safetyPlan.status === "review_due" || (safetyPlan.reviewDate && new Date(safetyPlan.reviewDate) < new Date()));
  const isServiceReviewDue = servicePlan && (servicePlan.status === "review_due" || (servicePlan.reviewDate && new Date(servicePlan.reviewDate) < new Date()));
  
  if (housingNeed && !hasHousingPlan) {
    nextBestActions.push({
      text: "Complete Housing Plan because housing need is high priority and no completed plan exists.",
      action: "Start Housing Plan",
      link: `/clients/${client.id}/plans/housing/new`
    });
  }

  if (safetyNeed && (!hasSafetyPlan || isSafetyReviewDue)) {
    nextBestActions.push({
      text: isSafetyReviewDue ? "Review safety plan because review date has passed." : "Complete Safety Plan because safety planning is identified as a need.",
      action: isSafetyReviewDue ? "Review Safety Plan" : "Start Safety Plan",
      link: `/clients/${client.id}/plans/safety/new`
    });
  }

  const dischargeNeed = needs.find(n => n.needType === "discharge_transition_planning");
  const dischargePlan = documents.find(d => d.type === "discharge_transition_plan");
  const hasDischargePlan = !!dischargePlan;

  if (dischargeNeed && !hasDischargePlan) {
    nextBestActions.push({
      text: "Complete Discharge / Transition Plan to prepare for client transition.",
      action: "Start Discharge Plan",
      link: `/clients/${client.id}/plans/discharge/new`
    });
  }

  if (!client.lastContactAt || new Date(client.lastContactAt).getTime() < nowMs - 7 * 24 * 60 * 60 * 1000) {
    nextBestActions.push({
      text: "Add case note because no contact has been documented in 7 days.",
      action: "Add Note",
      link: `/clients/${client.id}/notes/new`
    });
  }

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{client.displayName}</h1>
                <Badge className={cn("px-2.5 py-0.5 border capitalize", getStatusColor(client.status))}>
                  {client.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={cn("px-2.5 py-0.5 border capitalize", getPriorityColor(client.priority))}>
                  {client.priority} Priority
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-8 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-foreground">{client.clientCode}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium text-foreground">{client.siteId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="font-medium text-foreground truncate max-w-[200px]">{client.currentGoal || "No goal set"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last contact: <span className="font-medium text-foreground">{client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : "Never"}</span></span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Active Risks: <span className="font-bold">{activeRisk.length}</span></span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                  <ClipboardCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>Open Tasks: <span className="font-bold">{openTasks.length}</span></span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                  <ExternalLink className="h-3.5 w-3.5 text-purple-500" />
                  <span>Pending Referrals: <span className="font-bold">{pendingReferrals.length}</span></span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                  <FileText className="h-3.5 w-3.5 text-green-500" />
                  <span>Documentation: <span className={cn("font-bold", documentationChecklist?.housingPlanStarted ? "text-green-600" : "text-amber-600")}>
                    {documentationChecklist?.housingPlanStarted ? "Drafted" : "Missing Gaps"}
                  </span></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:w-auto w-full">
              <Link href={`/clients/${client.id}/notes/new`} className={buttonVariants({ variant: "default", size: "sm", className: "flex-1 md:flex-none" })}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Case Note
              </Link>
              <Link href={`/clients/${client.id}/plans/housing/new`} className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1 md:flex-none" })}>
                <ClipboardCheck className="h-4 w-4 mr-1.5" /> Start Housing Plan
              </Link>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                <FileText className="h-4 w-4 mr-1.5" /> Generate Summary
              </Button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12">
            <TabsTrigger value="overview">1. Overview</TabsTrigger>
            <TabsTrigger value="timeline">2. Timeline</TabsTrigger>
            <TabsTrigger value="notes">3. Notes</TabsTrigger>
            <TabsTrigger value="plans">4. Plans & Checklists</TabsTrigger>
            <TabsTrigger value="actions">5. Referrals & Tasks</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* CLIENT NEEDS */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" /> Client Needs
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {needs.length > 0 ? needs.map((need) => {
                      const isHousing = need.needType === "housing_support";
                      const doc = documents.find(d => need.relatedDocumentTypes.includes(d.type));
                      return (
                        <Card key={need.id} className="overflow-hidden border-l-4 border-l-primary">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-bold capitalize">{need.needType.replace("_", " ")}</p>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-[10px] uppercase">{need.priority}</Badge>
                                  <Badge variant="secondary" className="text-[10px] uppercase">{need.status.replace("_", " ")}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="text-muted-foreground">Next Action:</p>
                              <p className="font-medium">{need.recommendedNextAction}</p>
                            </div>
                            <div className="pt-2 flex items-center justify-between border-t">
                              <span className="text-xs text-muted-foreground flex flex-col">
                                <span>{doc ? `${doc.type.replace("_", " ")}: ${doc.status.replace("_", " ")}` : "Plan: Not Started"}</span>
                                {doc?.reviewDate && <span className="text-[10px]">Review: {new Date(doc.reviewDate).toLocaleDateString()}</span>}
                              </span>
                              <Link 
                                href={
                                  isHousing ? `/clients/${client.id}/plans/housing/new` : 
                                  (need.needType === "safety_planning" ? `/clients/${client.id}/plans/safety/new` : 
                                  (need.needType === "service_planning" ? `/clients/${client.id}/plans/service/new` : 
                                  (need.needType === "discharge_transition_planning" ? `/clients/${client.id}/plans/discharge/new` : "#")))
                                } 
                                className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 px-2 text-primary" })}
                              >
                                {doc ? (
                                  (isSafetyReviewDue && need.needType === "safety_planning") || 
                                  (isServiceReviewDue && need.needType === "service_planning") ? "Update Plan" : 
                                  (doc.status === "draft" ? "Continue Plan" : "Review Plan")
                                ) : "Start Plan"} <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }) : (
                      <p className="text-sm text-muted-foreground col-span-2 py-4 italic">No active needs documented.</p>
                    )}
                  </div>
                </section>

                {/* WORK IN PROGRESS (Workstreams) */}
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Work in Progress
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workstreams.map((ws) => (
                      <Card key={ws.id} className="bg-muted/30 border-dashed">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold capitalize text-sm">{ws.type.replace("_", " ")}</p>
                            <Badge variant="outline" className="text-[10px] uppercase">{ws.status.replace("_", " ")}</Badge>
                          </div>
                          <div className="text-xs space-y-2">
                            <div>
                              <p className="text-muted-foreground mb-0.5">Latest Action:</p>
                              <p className="line-clamp-1">{ws.latestAction}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-muted-foreground mb-0.5">Next Action:</p>
                                <p className="font-medium text-primary">{ws.nextAction}</p>
                              </div>
                              {ws.dueDate && (
                                <div className="text-right">
                                  <p className="text-muted-foreground mb-0.5">Due:</p>
                                  <p>{new Date(ws.dueDate).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {/* URGENT ATTENTION */}
                <Card className="border-red-200 dark:border-red-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-600 dark:text-red-400 text-base flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" /> Urgent Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {overdueTasks.length > 0 && (
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{overdueTasks.length} overdue follow-ups</span>
                      </div>
                    )}
                    {(!client.lastContactAt || new Date(client.lastContactAt).getTime() < nowMs - 7 * 24 * 60 * 60 * 1000) && (
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Clock className="h-4 w-4" />
                        <span>No contact in 7+ days</span>
                      </div>
                    )}
                    {activeRisk.some(r => r.severity === "high") && (
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>High-priority risk flag active</span>
                      </div>
                    )}
                    {(!documentationChecklist?.housingPlanStarted) && (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <FileText className="h-4 w-4" />
                        <span>Missing Housing Plan documentation</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* NEXT BEST ACTIONS */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Next Best Actions</h3>
                  <div className="space-y-2">
                    {nextBestActions.map((action, idx) => (
                      <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm space-y-2">
                        <p>{action.text}</p>
                        {action.link && (
                          <Link href={action.link} className="text-primary font-medium flex items-center hover:underline">
                            {action.action} <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    ))}
                    {nextBestActions.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No urgent actions suggested. Continue standard follow-up.</p>
                    )}
                  </div>
                </section>

                {/* RECENT ACTIVITY (Timeline Preview) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" /> Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {timeline.slice(0, 3).map((item) => (
                      <div key={item.id} className="border-l-2 border-muted pl-4 relative space-y-1">
                        <div className="absolute w-2 h-2 rounded-full bg-muted -left-[5px] top-1.5" />
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                          {new Date(item.date).toLocaleDateString()} • {item.type.replace("_", " ")}
                        </p>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>

          {/* TIMELINE TAB */}
          <TabsContent value="timeline" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" /> Client Timeline
                </CardTitle>
                <CardDescription>Comprehensive history of notes, tasks, referrals, and plans.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {timeline.length > 0 ? timeline.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {item.type === "case_note" && <FileText className="h-4 w-4" />}
                        {item.type === "task" && <CheckCircle2 className="h-4 w-4" />}
                        {item.type === "referral" && <ExternalLink className="h-4 w-4" />}
                        {item.type === "risk_flag" && <ShieldAlert className="h-4 w-4" />}
                        {item.type === "safety_plan" && <ShieldAlert className="h-4 w-4" />}
                        {item.type === "generated_document" && <FileText className="h-4 w-4" />}
                      </div>
                      <div className="w-px flex-1 bg-muted mt-2" />
                    </div>
                    <div className="flex-1 pb-8 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold">{item.title}</p>
                        <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.summary}</p>
                      {item.status && <Badge variant="outline" className="text-[10px] mt-2 capitalize">{item.status}</Badge>}
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-8 text-muted-foreground italic">No timeline activity recorded.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes" className="pt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-lg">Case Notes</CardTitle>
                  <CardDescription>Documentation of client interactions and progress.</CardDescription>
                </div>
                <Link href={`/notes/new?clientId=${client.id}`} className={buttonVariants({ variant: "default", size: "sm" })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Case Note
                </Link>
              </CardHeader>
              <CardContent className="p-0 border-t">
                {/* FILTERS */}
                <div className="p-4 bg-muted/20 border-b flex flex-wrap gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Staff" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="divide-y">
                  {notes.length > 0 ? notes.map((note) => (
                    <div key={note.id} className="p-4 hover:bg-muted/10 transition-colors space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{new Date(note.contactDate).toLocaleDateString()}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 h-4">
                              {note.category.replace("_", " ")}
                            </Badge>
                            {note.aiGenerated && (
                              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 h-4 bg-primary/10 text-primary border-primary/20">
                                <Sparkles className="h-2.5 w-2.5 mr-1" /> AI Assisted
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {note.contactType.replace("_", " ")} • {note.authorName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
                            navigator.clipboard.writeText(note.finalNote);
                            toast.success("Copied for SMIS");
                          }}>
                            <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> SMIS
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-3 bg-muted/5 p-3 rounded border border-muted/20 font-mono text-[11px] leading-relaxed">
                        {note.finalNote}
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-muted-foreground italic">No case notes found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLANS & CHECKLISTS TAB */}
          <TabsContent value="plans" className="pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HOUSING PLAN */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Housing Plan</CardTitle>
                    <Badge variant={documents.some(d => d.type === "housing_plan") ? "default" : "outline"}>
                      {documents.find(d => d.type === "housing_plan")?.status.replace("_", " ") || "Not Started"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latest Update:</span>
                      <span>{documents.find(d => d.type === "housing_plan")?.updatedAt ? new Date(documents.find(d => d.type === "housing_plan")!.updatedAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/plans/housing/new`} className={buttonVariants({ className: "flex-1", size: "sm" })}>
                      {documents.find(d => d.type === "housing_plan") ? "Update Plan" : "Start Plan"}
                    </Link>
                    {documents.find(d => d.type === "housing_plan") && (
                      <Link 
                        href={`/clients/${client.id}/plans/housing/${documents.find(d => d.type === "housing_plan")?.id}`} 
                        className={buttonVariants({ variant: "outline", className: "flex-1", size: "sm" })}
                      >
                        Review
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SAFETY PLAN */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Safety Plan</CardTitle>
                    </div>
                    <Badge variant={isSafetyReviewDue ? "destructive" : (hasSafetyPlan ? "default" : "outline")}>
                      {isSafetyReviewDue ? "Review Due" : (safetyPlan?.status.replace("_", " ") || "Not Started")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latest Update:</span>
                      <span>{safetyPlan?.updatedAt ? new Date(safetyPlan.updatedAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Review Date:</span>
                      <span className={cn(isSafetyReviewDue ? "text-red-600 font-bold" : "")}>
                        {safetyPlan?.reviewDate ? new Date(safetyPlan.reviewDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/plans/safety/new`} className={buttonVariants({ className: "flex-1", size: "sm" })}>
                      {hasSafetyPlan ? "Update Plan" : "Start Plan"}
                    </Link>
                    {hasSafetyPlan && (
                      <Link 
                        href={`/clients/${client.id}/plans/safety/${safetyPlan?.id}`} 
                        className={buttonVariants({ variant: "outline", className: "flex-1", size: "sm" })}
                      >
                        Review
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SERVICE PLAN */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Service Plan / Goals</CardTitle>
                    </div>
                    <Badge variant={isServiceReviewDue ? "destructive" : (hasServicePlan ? "default" : "outline")}>
                      {isServiceReviewDue ? "Review Due" : (servicePlan?.status.replace("_", " ") || "Not Started")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latest Update:</span>
                      <span>{servicePlan?.updatedAt ? new Date(servicePlan.updatedAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Review Date:</span>
                      <span className={cn(isServiceReviewDue ? "text-red-600 font-bold" : "")}>
                        {servicePlan?.reviewDate ? new Date(servicePlan.reviewDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/plans/service/new`} className={buttonVariants({ className: "flex-1", size: "sm" })}>
                      {hasServicePlan ? "Update Service Plan" : "Start Service Plan"}
                    </Link>
                    {hasServicePlan && (
                      <Link 
                        href={`/clients/${client.id}/plans/service/${servicePlan?.id}`} 
                        className={buttonVariants({ variant: "outline", className: "flex-1", size: "sm" })}
                      >
                        <ClipboardCopy className="h-3 w-3 mr-2" /> Copy for SMIS
                      </Link>
                    )}
                  </div>
                  
                  {/* PLAN HISTORY */}
                  {documents.filter(d => d.type === "service_plan").length > 1 && (
                    <div className="pt-4 border-t space-y-2">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Plan History</p>
                      <div className="space-y-1">
                        {documents.filter(d => d.type === "service_plan").slice(1).map(d => (
                          <div key={d.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded border border-transparent hover:border-primary/20 transition-colors">
                            <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                            <Link href={`/clients/${client.id}/plans/service/${d.id}`} className="text-primary hover:underline">View</Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* INTAKE ASSESSMENT */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Intake Assessment</CardTitle>
                    <Badge variant={documentationChecklist?.intakeCompleted ? "default" : "outline"}>
                      {documentationChecklist?.intakeCompleted ? "Completed" : "Not Started"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span>{documentationChecklist?.intakeCompleted ? "Assessment on file" : "Required for all new clients"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/plans/intake/new`} className={buttonVariants({ className: "flex-1", size: "sm" })}>
                      {documentationChecklist?.intakeCompleted ? "Update Intake" : "Start Intake"}
                    </Link>
                    {documentationChecklist?.intakeCompleted && (
                       <Button variant="outline" size="sm" className="flex-1">Review</Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* DOCUMENT CHECKLIST */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Document Checklist</CardTitle>
                    <Badge variant={documentationChecklist?.idStatusDocumented ? "default" : "outline"}>
                      {documentationChecklist?.idStatusDocumented ? "In Progress" : "Missing Gaps"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID/Income Status:</span>
                      <span>{documentationChecklist?.idStatusDocumented ? "Partially Documented" : "Not Started"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/plans/checklist/new`} className={buttonVariants({ className: "flex-1", size: "sm" })}>
                      Manage Documents
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* DISCHARGE / TRANSITION PLAN */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Discharge / Transition</CardTitle>
                    </div>
                    <Badge variant={hasDischargePlan ? "default" : "outline"}>
                      {dischargePlan?.status.replace("_", " ") || "Not Started"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latest Update:</span>
                      <span>{dischargePlan?.updatedAt ? new Date(dischargePlan.updatedAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    {hasDischargePlan && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transition Reason:</span>
                        <span className="capitalize">{(dischargePlan.sourceAnswers as any)?.transitionType || "N/A"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/plans/discharge/new`} className={buttonVariants({ className: "flex-1", size: "sm" })}>
                      {hasDischargePlan ? "Update Plan" : "Start Plan"}
                    </Link>
                    {hasDischargePlan && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(dischargePlan.generatedText);
                          toast.success("Discharge plan copied for SMIS");
                        }}
                      >
                        <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> SMIS
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REFERRALS & TASKS TAB */}
          <TabsContent value="actions" className="pt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OPEN TASKS */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Open Tasks
                    </CardTitle>
                    <Badge>{openTasks.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {openTasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <p className="font-bold">{task.title}</p>
                        <Badge variant="outline" className={cn("text-[9px] uppercase", task.status === "overdue" ? "text-red-600 border-red-200" : "")}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{task.description}</p>
                      <p className="text-[10px] pt-1">Due: <span className="font-semibold">{new Date(task.dueDate).toLocaleDateString()}</span></p>
                    </div>
                  ))}
                  {openTasks.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No open tasks.</p>}
                </CardContent>
              </Card>

              {/* PENDING REFERRALS */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" /> Pending Referrals
                    </CardTitle>
                    <Badge>{pendingReferrals.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingReferrals.map((ref) => (
                    <div key={ref.id} className="p-3 border rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <p className="font-bold capitalize">{ref.referralType} Referral</p>
                        <Badge variant="outline" className="text-[9px] uppercase">{ref.status}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{ref.agencyName} • {ref.contactPerson || "No contact info"}</p>
                      <p className="text-[10px] pt-1">Initiated: <span className="font-semibold">{new Date(ref.referralDate).toLocaleDateString()}</span></p>
                    </div>
                  ))}
                  {pendingReferrals.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No pending referrals.</p>}
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
