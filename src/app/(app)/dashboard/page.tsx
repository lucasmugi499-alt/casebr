"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/lib/services/dashboardService";
import { AlertCircle, CalendarClock, FileText, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Client, Task } from "@/types";

interface DashboardData {
  metrics: { label: string; value: number }[];
  assignedClients: Client[];
  highPriorityClients: Client[];
  overdueTasks: Task[];
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
      })
      .then((result) => {
        if (!active) return;
        setData(result);
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

  const metricIcons = useMemo(
    () => [Users, CalendarClock, AlertCircle, AlertCircle, FileText],
    []
  );

  return (
    <AuthGuard allowedRoles={["caseworker"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Start of shift</h2>
          <p className="text-muted-foreground">Today’s casework priorities and assigned client activity.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/clients" className={buttonVariants()}><Plus className="mr-2 h-4 w-4" />Add Case Note</Link>
          <Link href="/clients/new" className={buttonVariants({ variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Client</Link>
          <Link href="/tasks/new" className={buttonVariants({ variant: "outline" })}><Plus className="mr-2 h-4 w-4" />Add Follow-Up</Link>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-5">{Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} className="h-28" />)}</div>
        )}

        {error && (
          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-red-700">Unable to load dashboard</CardTitle></CardHeader>
            <CardContent className="text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {!loading && data && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {data.metrics.map((metric, index) => {
                const Icon = metricIcons[index] ?? Users;
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
                <CardTitle>Assigned clients</CardTitle>
                <CardDescription>Open a profile and add case notes directly from this list.</CardDescription>
              </CardHeader>
              <CardContent>
                {!data.assignedClients.length ? (
                  <p className="text-sm text-muted-foreground">No clients are currently assigned to you.</p>
                ) : (
                  <div className="space-y-3">
                    {data.assignedClients.slice(0, 8).map((client) => (
                      <div key={client.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="font-medium">{client.displayName}</p>
                          <p className="text-xs text-muted-foreground">{client.clientCode} • {client.priority} priority</p>
                        </div>
                        <Link href={`/clients/${client.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open client</Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
