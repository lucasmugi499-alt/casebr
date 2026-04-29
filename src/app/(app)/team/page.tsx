"use client";

import AuthGuard from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { getSupervisorOperationalBoard } from "@/lib/demo/demoServices";
import { assignDemoClient, addDemoTask, addDemoSupervisorReview } from "@/lib/demo/demoStore";
import { cn } from "@/lib/utils";
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  BarChart3, 
  Search,
  Plus,
  ArrowRight,
  MoreVertical,
  Activity,
  UserCheck,
  ClipboardCheck,
  AlertCircle,
  MapPin,
  Calendar,
  Target,
  User
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardFooter } from "@/components/ui/card";
import { 
  SupervisorOperationalBoard, 
  AttentionQueueItem, 
  StaffWorkloadItem, 
  RiskQueueItem, 
  SafetyReviewItem, 
  DocumentationGapItem, 
  RecentActivityItem,
  Client,
  User as UserType
} from "@/types";

export default function SupervisorCommandCentrePage({ initialTab }: { initialTab?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = initialTab || searchParams.get("tab") || "overview";
  
  const [data, setData] = useState<SupervisorOperationalBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const refreshData = () => {
    const actor = getDemoActor();
    if (actor) {
      const board = getSupervisorOperationalBoard(actor);
      setData(board);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center">Loading operational board...</div>;
  }

  const { summary, unassignedClients, attentionQueue, staffWorkload, riskQueue, safetyReviews, documentationGaps, recentActivity, caseworkers } = data;

  return (
    <AuthGuard allowedRoles={["ssa", "manager", "admin"]}>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Supervisor Command Centre</h1>
            <p className="text-muted-foreground">Assignments, client attention, workload, risk reviews, and documentation oversight.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setActiveTab("assignments")} className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border">
              <UserPlus className="h-4 w-4 mr-2" /> Assign Client
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("risk")}>
              <ShieldAlert className="h-4 w-4 mr-2" /> Review Risk
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("documentation")}>
              <FileText className="h-4 w-4 mr-2" /> Docs Gaps
            </Button>
            <Button size="sm" variant="default">
              <Plus className="h-4 w-4 mr-2" /> New Review
            </Button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <SummaryCard 
            title="Unassigned" 
            value={summary.unassignedCount} 
            icon={<UserPlus className="h-4 w-4" />} 
            status={summary.unassignedCount > 0 ? "warning" : "default"}
            onClick={() => setActiveTab("assignments")}
          />
          <SummaryCard 
            title="Attention Required" 
            value={attentionQueue.length} 
            icon={<AlertTriangle className="h-4 w-4" />} 
            status={attentionQueue.length > 5 ? "destructive" : "warning"}
            onClick={() => setActiveTab("attention")}
          />
          <SummaryCard 
            title="Risk Reviews" 
            value={summary.riskReviewsRequired} 
            icon={<ShieldAlert className="h-4 w-4" />} 
            status={summary.riskReviewsRequired > 0 ? "destructive" : "default"}
            onClick={() => setActiveTab("risk")}
          />
          <SummaryCard 
            title="Docs Gaps" 
            value={summary.documentationGaps} 
            icon={<FileText className="h-4 w-4" />} 
            status={summary.documentationGaps > 10 ? "warning" : "default"}
            onClick={() => setActiveTab("documentation")}
          />
          <SummaryCard 
            title="Overdue Tasks" 
            value={summary.overdueTasks} 
            icon={<Clock className="h-4 w-4" />} 
            status={summary.overdueTasks > 5 ? "warning" : "default"}
            onClick={() => setActiveTab("workload")}
          />
        </div>

        {/* MAIN TABS */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value ?? "overview")} className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments" className="relative">
              Assignments
              {summary.unassignedCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                  {summary.unassignedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="attention">Attention Queue</TabsTrigger>
            <TabsTrigger value="workload">Workload Board</TabsTrigger>
            <TabsTrigger value="risk">Risk & Safety</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP ATTENTION ITEMS */}
              <Card className="col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" /> Critical Attention Needed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {attentionQueue.slice(0, 5).map((item: AttentionQueueItem) => (
                      <div key={item.client.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-bold">{item.client.displayName}</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {item.reasons.slice(0, 2).map((r: string) => (
                              <Badge key={r} variant="outline" className="text-[10px] py-0 h-4 bg-destructive/5 text-destructive border-destructive/20">{r}</Badge>
                            ))}
                            {item.reasons.length > 2 && <span className="text-[10px] text-muted-foreground">+{item.reasons.length - 2} more</span>}
                          </div>
                        </div>
                        <Link href={`/clients/${item.client.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 px-2" })}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-muted/20 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("attention")}>View all {attentionQueue.length} items</Button>
                  </div>
                </CardContent>
              </Card>

              {/* STAFF STATUS SUMMARY */}
              <Card className="col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" /> Staff Workload Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {staffWorkload.slice(0, 5).map((item: StaffWorkloadItem) => (
                      <div key={item.worker.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-bold">{item.worker.firstName} {item.worker.lastName}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            <span>{item.clientCount} Clients</span>
                            <span>{item.overdueCount} Overdue</span>
                            <Badge variant="outline" className={cn(
                              "text-[9px] py-0 h-4",
                              item.workloadStatus === 'overloaded' ? "bg-destructive/10 text-destructive border-destructive/20" :
                              item.workloadStatus === 'high' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-green-50 text-green-700 border-green-200"
                            )}>
                              {item.workloadStatus.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setActiveTab("workload")}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-muted/20 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("workload")}>Manage team workload</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RECENT ACTIVITY PREVIEW */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Recent Team Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentActivity.slice(0, 6).map((log: RecentActivityItem) => (
                    <div key={log.id} className="p-3 px-4 flex items-center justify-between hover:bg-muted/5">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted rounded-full p-1.5">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            <span className="font-bold">{log.user?.firstName} {log.user?.lastName}</span> 
                            <span className="text-muted-foreground mx-1">completed</span> 
                            <span className="font-bold">{log.action.replace("_", " ")}</span>
                            {log.client && <span className="text-muted-foreground mx-1">for</span>}
                            {log.client && <span className="font-bold">{log.client.displayName}</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSIGNMENTS TAB */}
          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unassigned / New Clients</CardTitle>
                <CardDescription>Clients awaiting initial caseworker assignment or review.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {unassignedClients.length > 0 ? unassignedClients.map((client: Client) => (
                    <div key={client.id} className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{client.displayName}</span>
                            <Badge variant="outline" className="text-[10px]">{client.clientCode}</Badge>
                            <Badge className={cn(
                              "text-[10px] uppercase",
                              client.priority === "high" ? "bg-destructive text-white" : "bg-primary"
                            )}>{client.priority} Priority</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Site ID: {client.siteId}</div>
                            <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Intake: {new Date(client.createdAt).toLocaleDateString()}</div>
                            <div className="flex items-center gap-1.5 col-span-2"><Target className="h-3 w-3" /> Goal: {client.currentGoal}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <AssignmentAction client={client} caseworkers={caseworkers} onAssigned={refreshData} />
                          <Link href={`/clients/${client.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open Client</Link>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-muted-foreground italic">No unassigned clients at this time.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ATTENTION TAB */}
          <TabsContent value="attention" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Attention Queue</CardTitle>
                <CardDescription>Clients needing supervisor awareness due to overdue work or risk triggers.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {attentionQueue.length > 0 ? attentionQueue.map((item: AttentionQueueItem) => (
                    <div key={item.client.id} className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{item.client.displayName}</span>
                            <Badge variant="outline" className="text-[10px]">{item.client.clientCode}</Badge>
                            {item.riskLevel === "high" && <Badge variant="destructive" className="text-[10px] uppercase">High Risk</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.reasons.map((r: string) => (
                              <Badge key={r} variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{r}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Assigned: {item.assignedWorkers.map((w: any) => `${w.firstName} ${w.lastName}`).join(", ") || "Unassigned"}</span>
                            <span>Last Contact: {item.lastContactAt ? new Date(item.lastContactAt).toLocaleDateString() : "Never"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/clients/${item.client.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open File</Link>
                          <Button size="sm" variant="default">Add Review</Button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-muted-foreground italic">No clients in the attention queue.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WORKLOAD TAB */}
          <TabsContent value="workload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffWorkload.map((item: StaffWorkloadItem) => (
                <StaffWorkloadCard key={item.worker.id} item={item} />
              ))}
            </div>
          </TabsContent>

          {/* RISK TAB */}
          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk & Safety Review Queue</CardTitle>
                <CardDescription>Active risk flags and safety plans requiring supervisor sign-off.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {riskQueue.length === 0 && safetyReviews.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic">No risk or safety reviews pending.</div>
                  )}
                  {riskQueue.map((item: RiskQueueItem) => (
                    <div key={item.risk.id} className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-destructive" />
                            <span className="font-bold">{item.client?.displayName}</span>
                            <Badge variant="destructive" className="text-[10px] uppercase">{item.risk.severity} Severity</Badge>
                            <Badge variant="outline" className="text-[10px] uppercase">{item.risk.category}</Badge>
                          </div>
                          <p className="text-sm text-foreground/80">{item.risk.description}</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Created by {item.worker?.firstName} {item.worker?.lastName} on {new Date(item.risk.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="default">Sign Off</Button>
                          <Button size="sm" variant="outline">Comment</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {safetyReviews.map((item: SafetyReviewItem) => (
                    <div key={item.doc.id} className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-primary" />
                            <span className="font-bold">{item.client?.displayName}</span>
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">Safety Plan Review</Badge>
                          </div>
                          <p className="text-sm text-foreground/80 italic">"Due for 30-day review of de-escalation protocols and community supports."</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Owner: {item.worker?.firstName} {item.worker?.lastName} • Due: {item.doc.reviewDate ? new Date(item.doc.reviewDate).toLocaleDateString() : "ASAP"}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="default">Complete Review</Button>
                          <Link href={`/clients/${item.client?.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>View Plan</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTATION TAB */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentation Gaps</CardTitle>
                <CardDescription>Monitoring completion of required intake and planning documents.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {documentationGaps.length > 0 ? documentationGaps.map((item: DocumentationGapItem) => (
                    <div key={item.client.id} className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{item.client.displayName}</span>
                            <Badge variant="outline" className="text-[10px]">{item.client.clientCode}</Badge>
                            <Badge variant="secondary" className="text-[10px] uppercase bg-amber-50 text-amber-700 border-amber-200">
                              {item.gaps.length} Gaps
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.gaps.map((g: string) => (
                              <Badge key={g} variant="outline" className="text-[10px] border-destructive/30 text-destructive/80">{g} Missing</Badge>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            Assigned: {item.assignedWorkers.map((w: any) => `${w.firstName} ${w.lastName}`).join(", ") || "UNASSIGNED"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => {
                            addDemoTask({
                              id: `gap_task_${Date.now()}`,
                              organizationId: item.client.organizationId,
                              siteId: item.client.siteId,
                              clientId: item.client.id,
                              assignedToId: item.assignedWorkers[0]?.id || "system",
                              createdById: user?.id || "system",
                              title: `Complete ${item.gaps[0]} for ${item.client.displayName}`,
                              description: "Documentation gap identified by supervisor.",
                              dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                              priority: "medium",
                              status: "open"
                            });
                            toast.success(`Task created for ${item.assignedWorkers[0]?.firstName || "caseworker"}`);
                          }}>Request Completion</Button>
                          <Link href={`/clients/${item.client.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open Client</Link>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-muted-foreground italic">No documentation gaps identified.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Full Team Activity Log</CardTitle>
                <CardDescription>Audit of recent actions and documentation completions.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentActivity.map((log: RecentActivityItem) => (
                    <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-muted/5 transition-colors">
                      <div className="bg-muted rounded-full p-2 mt-1">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">
                            {log.user?.firstName} {log.user?.lastName}
                          </p>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm">
                          Performed action <span className="font-mono text-xs bg-muted px-1 rounded">{log.action}</span>
                          {log.client && <span> on client <strong>{log.client.displayName}</strong></span>}
                        </p>
                        {log.metadata && <pre className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

function SummaryCard({ title, value, icon, status = "default", onClick }: { title: string; value: number; icon: React.ReactNode; status?: "default" | "warning" | "destructive"; onClick?: () => void }) {
  return (
    <Card className={cn(
      "cursor-pointer hover:shadow-md transition-all border-l-4",
      status === "destructive" ? "border-l-destructive shadow-destructive/5" :
      status === "warning" ? "border-l-amber-500 shadow-amber-500/5" :
      "border-l-primary/40 shadow-primary/5",
      onClick && "hover:bg-muted/5"
    )} onClick={onClick}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          "p-1.5 rounded-md",
          status === "destructive" ? "bg-destructive/10 text-destructive" :
          status === "warning" ? "bg-amber-50 text-amber-600" :
          "bg-primary/10 text-primary"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function StaffWorkloadCard({ item }: { item: StaffWorkloadItem }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all group">
      <CardHeader className={cn(
        "pb-4 border-b",
        item.workloadStatus === 'overloaded' ? "bg-destructive/5" :
        item.workloadStatus === 'high' ? "bg-amber-50/50" :
        "bg-green-50/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-muted-foreground border-2 border-background shadow-sm">
              {item.worker.firstName[0]}{item.worker.lastName[0]}
            </div>
            <div>
              <CardTitle className="text-base">{item.worker.firstName} {item.worker.lastName}</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-tight">{item.worker.title}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "text-[9px] py-0 h-5 font-bold uppercase",
            item.workloadStatus === 'overloaded' ? "bg-destructive text-white border-none" :
            item.workloadStatus === 'high' ? "bg-amber-100 text-amber-800 border-amber-200" :
            "bg-green-100 text-green-800 border-green-200"
          )}>
            {item.workloadStatus.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Caseload</p>
            <p className="text-xl font-bold">{item.clientCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Overdue</p>
            <p className="text-xl font-bold text-destructive">{item.overdueCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">High Priority</p>
            <p className="text-xl font-bold text-amber-600">{item.highPriorityCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Notes / Week</p>
            <p className="text-xl font-bold text-primary">{item.notesThisWeek}</p>
          </div>
        </div>
        
        <div className="pt-4 border-t flex items-center justify-between text-[10px] text-muted-foreground italic">
          <span>Active: {new Date(item.lastActivity).toLocaleDateString()}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold px-2">View Caseload</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentAction({ client, caseworkers, onAssigned }: { client: Client; caseworkers: UserType[]; onAssigned: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleWorker = (id: string) => {
    setSelectedWorkers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAssign = () => {
    if (selectedWorkers.length === 0) {
      toast.error("Please select at least one worker.");
      return;
    }
    setSaving(true);
    // Simulate delay
    setTimeout(() => {
      assignDemoClient(client.id, selectedWorkers, note);
      setSaving(false);
      setOpen(false);
      onAssigned();
      toast.success(`Client assigned to ${selectedWorkers.length} worker(s).`);
    }, 800);
  };

  return (
    <>
      <Button size="sm" variant="default" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" /> Assign Worker
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle>Assign Client: {client.displayName}</CardTitle>
              <CardDescription>Select one or more caseworkers for this file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {caseworkers.map(worker => (
                  <div 
                    key={worker.id} 
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between",
                      selectedWorkers.includes(worker.id) ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                    onClick={() => toggleWorker(worker.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                        {worker.firstName[0]}{worker.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{worker.firstName} {worker.lastName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{worker.title}</p>
                      </div>
                    </div>
                    {selectedWorkers.includes(worker.id) && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Assignment Note (Optional)</Label>
                <Textarea 
                  placeholder="Reason for assignment, initial focus, or specific instructions..." 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={saving}>{saving ? "Assigning..." : "Confirm Assignment"}</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}

