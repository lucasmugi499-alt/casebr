"use client";

import AuthGuard from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoDocumentChecklistForClient, getDemoDocumentationChecklistForClient, getDemoGeneratedDocumentsForClient, getDemoNeedsForClient, getDemoTimelineForClient, getDemoWorkstreamsForClient } from "@/lib/demo/demoServices";
import { isDemoMode } from "@/lib/demo/demoMode";
import { updateDemoDocumentationChecklist } from "@/lib/demo/demoStore";
import { caseNotesService } from "@/lib/services/caseNotesService";
import { clientsService } from "@/lib/services/clientsService";
import { referralsService } from "@/lib/services/referralsService";
import { riskFlagsService } from "@/lib/services/riskFlagsService";
import { safetyPlansService } from "@/lib/services/safetyPlansService";
import { tasksService } from "@/lib/services/tasksService";
import { CaseNote, Client, ClientNeed, DocumentChecklist, DocumentationChecklist, GeneratedDocument, Referral, RiskFlag, SafetyPlan, Task, TimelineItem, Workstream } from "@/types";
import { AlertTriangle, ClipboardCheck, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

    const actor = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
      siteIds: user.siteIds,
    };

    Promise.all([
      clientsService.getClientById(id, actor),
      caseNotesService.getNotesForClient(id, actor),
      tasksService.getTasksForClient(id, actor),
      referralsService.getReferralsForClient(id, actor),
      riskFlagsService.getRiskFlagsForClient(id, actor),
      safetyPlansService.getSafetyPlansForClient(id),
    ])
      .then(([clientRecord, clientNotes, clientTasks, clientReferrals, clientRisk, clientSafety]) => {
        setClient(clientRecord);
        setNotes(clientNotes);
        setTasks(clientTasks);
        setReferrals(clientReferrals);
        setRiskFlags(clientRisk);
        setSafetyPlans(clientSafety);

        if (isDemoMode()) {
          setWorkstreams(getDemoWorkstreamsForClient(id));
          setNeeds(getDemoNeedsForClient(id));
          setDocuments(getDemoGeneratedDocumentsForClient(id));
          setDocumentationChecklist(getDemoDocumentationChecklistForClient(id));
          setDocumentChecklist(getDemoDocumentChecklistForClient(id));
          setTimeline(getDemoTimelineForClient(id));
        }
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const overdueTasks = tasks.filter((task) => task.status !== "completed" && new Date(task.dueDate).getTime() < nowMs);
  const pendingReferrals = referrals.filter((referral) => ["pending", "no_response"].includes(referral.status));
  const activeRisk = riskFlags.filter((flag) => flag.active);
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const nextBestActions: string[] = [];
  const housingNeed = needs.find((need) => need.needType === "housing_support");
  const hasHousingPlan = documents.some((doc) => doc.type === "housing_plan");
  if (housingNeed && !hasHousingPlan) {
    nextBestActions.push("Complete housing plan because housing support need is active and no completed plan exists.");
  }
  if (!client?.lastContactAt || new Date(client.lastContactAt).getTime() < nowMs - 7 * 24 * 60 * 60 * 1000) {
    nextBestActions.push("Add case note because no client contact is documented in the last 7 days.");
  }
  const delayedReferral = pendingReferrals.find((referral) => new Date(referral.referralDate).getTime() < nowMs - 7 * 24 * 60 * 60 * 1000);
  if (delayedReferral) {
    nextBestActions.push(`Follow up with ${delayedReferral.agencyName} because referral is pending more than 7 days.`);
  }
  const dueSafety = safetyPlans.find((plan) => new Date(plan.reviewDate).getTime() < nowMs);
  if (dueSafety) {
    nextBestActions.push("Review safety plan because review date has passed.");
  }

  const updateChecklist = () => {
    if (!id || !isDemoMode()) return;
    const updated = updateDemoDocumentationChecklist(id, { intakeCompleted: true, servicePlanStarted: true, housingPlanStarted: true });
    setDocumentationChecklist(updated);
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading client work file…</p>
      ) : !client ? (
        <Card><CardContent className="py-6">Client not found or access denied.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">{client.displayName}</h2>
                <Badge>{client.status}</Badge>
                <Badge variant="secondary">{client.priority} priority</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Client Work File • {client.clientCode} • Site: {client.siteId}</p>
              <p className="text-sm">Current goal: {client.currentGoal || "Not set"}</p>
              <p className="text-xs text-muted-foreground">Last contact: {client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : "Not documented"} • Next follow-up: {client.nextFollowUpAt ? new Date(client.nextFollowUpAt).toLocaleDateString() : "Not documented"}</p>
              <p className="text-xs text-muted-foreground">Active risk: {activeRisk.length} • Open tasks: {openTasks.length} • Pending referrals: {pendingReferrals.length}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/clients/${client.id}/notes/new`} className={buttonVariants({ size: "sm" })}><FileText className="mr-2 h-4 w-4" />Add Case Note</Link>
              <Link href="/tasks/new" className={buttonVariants({ size: "sm", variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Follow-Up</Link>
              <Link href="/clients" className={buttonVariants({ size: "sm", variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Referral</Link>
              <Link href={`/risk/new?client=${client.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}><AlertTriangle className="mr-2 h-4 w-4" />Add Risk Flag</Link>
              <Link href={`/clients/${client.id}/plans/housing/new`} className={buttonVariants({ size: "sm", variant: "outline" })}><ClipboardCheck className="mr-2 h-4 w-4" />Generate Summary</Link>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="plans">Plans & Checklists</TabsTrigger>
              <TabsTrigger value="actions">Referrals & Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Client Snapshot</CardTitle></CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-2">
                  <p className="text-sm"><span className="font-medium">Housing stage:</span> {workstreams.find((item) => item.type === "housing")?.status ?? "Not documented"}</p>
                  <p className="text-sm"><span className="font-medium">Income / benefits:</span> {workstreams.find((item) => item.type === "income_benefits")?.status ?? "Not documented"}</p>
                  <p className="text-sm"><span className="font-medium">ID / documents:</span> {workstreams.find((item) => item.type === "identification_documents")?.status ?? "Not documented"}</p>
                  <p className="text-sm"><span className="font-medium">Safety status:</span> {safetyPlans[0]?.status ?? "Not documented"}</p>
                  <p className="text-sm"><span className="font-medium">Main barriers:</span> {needs.slice(0, 2).map((need) => need.needType).join(", ") || "Not documented"}</p>
                  <p className="text-sm"><span className="font-medium">Next best action:</span> {nextBestActions[0] ?? "Continue current follow-up actions."}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Client Needs</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {needs.length === 0 ? <p className="text-sm text-muted-foreground">No client needs documented yet.</p> : needs.map((need) => {
                    const linkedPlan = documents.find((doc) => need.relatedDocumentTypes.includes(doc.type));
                    const housingAction = need.needType === "housing_support" ? `/clients/${client.id}/plans/housing/new` : `/clients/${client.id}`;
                    return (
                      <div key={need.id} className="rounded-md border p-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          <p className="font-medium">{need.needType.replaceAll("_", " ")}</p>
                          <Badge>{need.status}</Badge>
                          <Badge variant="secondary">{need.priority}</Badge>
                        </div>
                        <p className="text-sm">Next action: {need.recommendedNextAction}</p>
                        <p className="text-xs text-muted-foreground">Plan status: {linkedPlan?.status ?? "Not started"}</p>
                        <Link href={housingAction} className={buttonVariants({ size: "sm", variant: "outline" })}>{linkedPlan ? "Review" : "Start"}</Link>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Work in Progress</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {workstreams.length === 0 ? <p className="text-sm text-muted-foreground">No active workstreams.</p> : workstreams.map((ws) => (
                    <div key={ws.id} className="rounded border p-3">
                      <p className="font-medium capitalize">{ws.type.replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{ws.status} • Due {ws.dueDate ? new Date(ws.dueDate).toLocaleDateString() : "Not documented"}</p>
                      <p className="text-sm">Latest: {ws.latestAction}</p>
                      <p className="text-sm">Next: {ws.nextAction}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Urgent Attention</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Overdue tasks: {overdueTasks.length}</p>
                  <p>Safety plan review due: {safetyPlans.filter((plan) => new Date(plan.reviewDate).getTime() < nowMs).length}</p>
                  <p>Active high-risk flags: {activeRisk.filter((risk) => risk.severity === "high").length}</p>
                  <p>Referrals waiting more than 7 days: {pendingReferrals.filter((referral) => new Date(referral.referralDate).getTime() < nowMs - 7 * 86400000).length}</p>
                  <p>No contact in 7 days: {(!client.lastContactAt || new Date(client.lastContactAt).getTime() < nowMs - 7 * 86400000) ? "Yes" : "No"}</p>
                  <p>Missing documentation: {documentationChecklist && (!documentationChecklist.intakeCompleted || !documentationChecklist.housingPlanStarted) ? "Yes" : "No"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Next Best Actions</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {nextBestActions.length ? nextBestActions.map((action) => <li key={action}>{action}</li>) : <li>Continue with scheduled follow-ups.</li>}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Timeline</CardTitle>
                  <CardDescription>Combined history: notes, tasks, referrals, risk, and plan updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!timeline.length ? (
                    <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  ) : timeline.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()} • {item.type}</p>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Case Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded border p-3">
                      <p className="text-xs text-muted-foreground">{new Date(note.contactDate).toLocaleDateString()} • {note.contactType} • {note.category}</p>
                      <p className="text-sm line-clamp-3">{note.finalNote}</p>
                      <div className="mt-1 flex gap-2">{note.aiGenerated && <Badge variant="secondary">AI-assisted</Badge>}{note.supervisorReviewed && <Badge variant="outline">Supervisor reviewed</Badge>}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Documentation Status</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Intake Assessment: {documentationChecklist?.intakeCompleted ? "completed" : "not started"}</p>
                  <p>Initial Service Plan: {documentationChecklist?.servicePlanStarted ? "in progress" : "not started"}</p>
                  <p>Housing Plan: {documents.find((doc) => doc.type === "housing_plan")?.status ?? "not started"}</p>
                  <p>Safety Plan: {safetyPlans.length ? safetyPlans[0].status : "not started"}</p>
                  <p>Document Checklist: {documentChecklist ? "in progress" : "not started"}</p>
                  <button onClick={updateChecklist} className={buttonVariants({ variant: "outline", size: "sm" })}>Update checklist</button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Housing Plan</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm">Latest generated plan: {documents.find((doc) => doc.type === "housing_plan")?.title ?? "No housing plan generated yet."}</p>
                  <div className="mt-2 flex gap-2">
                    <Link href={`/clients/${client.id}/plans/housing/new`} className={buttonVariants({ size: "sm" })}>Start / Update Housing Plan</Link>
                    {documents.find((doc) => doc.type === "housing_plan") && <Link href={`/clients/${client.id}/plans/housing/${documents.find((doc) => doc.type === "housing_plan")?.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Review / Copy for SMIS</Link>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="mt-4 space-y-4">
              <Card><CardHeader><CardTitle>Open Tasks</CardTitle></CardHeader><CardContent className="space-y-2">{openTasks.map((task) => <div key={task.id} className="text-sm rounded border p-2">{task.title} • {task.status} • Due {new Date(task.dueDate).toLocaleDateString()}</div>)}</CardContent></Card>
              <Card><CardHeader><CardTitle>Pending Referrals</CardTitle></CardHeader><CardContent className="space-y-2">{pendingReferrals.map((referral) => <div key={referral.id} className="text-sm rounded border p-2">{referral.referralType} • {referral.agencyName} • {referral.status}</div>)}</CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AuthGuard>
  );
}
