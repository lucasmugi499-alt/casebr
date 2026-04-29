"use client";

import AuthGuard from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/lib/services/dashboardService";
import { CaseNote, Client, Task } from "@/types";
import { AlertCircle, CalendarClock, FileText, Plus, ShieldAlert, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface PriorityQueueItem {
  key: string;
  clientId: string;
  clientName: string;
  clientCode: string;
  priority: string;
  reason: string;
  nextAction: string;
  dueDate: string;
  workstream: string;
  badge: string;
  risk: string;
  lastContactAt: string;
}

interface DashboardData {
  metrics: { label: string; value: number }[];
  assignedClients: Client[];
  overdueTasks: Task[];
  notesThisWeek: CaseNote[];
  todayPriorityQueue: PriorityQueueItem[];
}

export default function CaseworkerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let active = true;

    dashboardService
      .getCaseworkerDashboard({
        id: user.id,
        organizationId: user.organizationId,
        role: user.role,
        siteIds: user.siteIds,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .then((result) => {
        if (!active) return;
        setData(result as DashboardData);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const metricIcons = useMemo(() => [Users, CalendarClock, AlertCircle, ShieldAlert, FileText], []);

  return (
    <AuthGuard allowedRoles={["caseworker"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Start of Shift</h2>
          <p className="text-muted-foreground">Today’s priorities, client work, documentation, and follow-ups.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/notes/new" className={buttonVariants()}><Plus className="mr-2 h-4 w-4" />Add Case Note</Link>
          <Link href="/clients/new" className={buttonVariants({ variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Client</Link>
          <Link href="/tasks/new" className={buttonVariants({ variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Follow-Up</Link>
          <Link href="/clients" className={buttonVariants({ variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Referral</Link>
          <Link href="/risk" className={buttonVariants({ variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Risk Flag</Link>
          <Link href="/risk" className={buttonVariants({ variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Safety Plan</Link>
        </div>

        {loading && <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, idx) => <Skeleton key={idx} className="h-28" />)}</div>}

        {error && (
          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-red-700">Unable to load dashboard</CardTitle></CardHeader>
            <CardContent className="text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {!loading && data && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data.metrics.map((metric, index) => {
                const Icon = metricIcons[index % metricIcons.length] ?? Users;
                return (
                  <Card key={metric.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{metric.value}</div></CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Today’s Priority Queue</CardTitle>
                <CardDescription>Actions requiring attention today, including overdue, blocked, safety, and referral items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!data.todayPriorityQueue.length ? (
                  <p className="text-sm text-muted-foreground">No urgent queue items right now.</p>
                ) : data.todayPriorityQueue.slice(0, 12).map((item) => (
                  <div key={item.key} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.clientName}</p>
                      <Badge variant="outline">{item.clientCode}</Badge>
                      <Badge>{item.badge}</Badge>
                      {item.risk && <Badge variant="destructive">Risk</Badge>}
                    </div>
                    <p className="text-sm mt-2"><span className="font-medium">Reason:</span> {item.reason}</p>
                    <p className="text-sm text-muted-foreground">Next Action: {item.nextAction}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(item.dueDate).toLocaleDateString()} • Workstream: {item.workstream} • Last contact: {item.lastContactAt ? new Date(item.lastContactAt).toLocaleDateString() : "Not documented"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href={`/clients/${item.clientId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open Work File</Link>
                      <Link href={`/clients/${item.clientId}/notes/new`} className={buttonVariants({ variant: "outline", size: "sm" })}>Add Note</Link>
                      <Link href="/tasks" className={buttonVariants({ size: "sm" })}>Complete Action</Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Clients Workboard</CardTitle>
                <CardDescription>Compact view of work in progress, follow-ups, and documentation status for each client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!data.assignedClients.length ? (
                  <p className="text-sm text-muted-foreground">No clients are currently assigned to you.</p>
                ) : (
                  data.assignedClients.slice(0, 10).map((client) => (
                    <div key={client.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{client.displayName}</p>
                        <Badge variant="outline">{client.clientCode}</Badge>
                        <Badge>{client.status}</Badge>
                        <Badge variant="secondary">{client.priority} priority</Badge>
                      </div>
                      <p className="text-sm mt-2">Current goal: {client.currentGoal || "Not documented"}</p>
                      <p className="text-xs text-muted-foreground">Last contact: {client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : "Not documented"} • Next follow-up: {client.nextFollowUpAt ? new Date(client.nextFollowUpAt).toLocaleDateString() : "Not documented"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link href={`/clients/${client.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open Work File</Link>
                        <Link href={`/clients/${client.id}/notes/new`} className={buttonVariants({ variant: "outline", size: "sm" })}>Add Note</Link>
                        <Link href="/tasks/new" className={buttonVariants({ variant: "outline", size: "sm" })}>Add Task</Link>
                        <Link href="/clients" className={buttonVariants({ variant: "outline", size: "sm" })}>Add Referral</Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Recent Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.notesThisWeek.slice(0, 6).map((note) => (
                    <div key={note.id} className="rounded-lg border bg-muted/5 p-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">
                          {note.category.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(note.contactDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-mono line-clamp-2 leading-relaxed text-foreground/80 mb-2">
                        {note.finalNote}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {note.aiGenerated && <Sparkles className="h-3 w-3 text-primary" />}
                        </div>
                        <Link href={`/clients/${note.clientId}?tab=notes`} className={buttonVariants({ size: "sm", variant: "ghost", className: "h-7 text-[10px] font-bold uppercase" })}>
                          Open File
                        </Link>
                      </div>
                    </div>
                  ))}
                  {data.notesThisWeek.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No recent notes documented.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>My Open Work</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data.overdueTasks.slice(0, 8).map((task) => (
                    <div key={task.id} className="rounded border p-3">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due {new Date(task.dueDate).toLocaleDateString()} • {task.status} • {task.priority} priority</p>
                      <Link href="/tasks" className={buttonVariants({ size: "sm", variant: "outline" })}>Open task</Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
