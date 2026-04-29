"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { getDemoManagementDashboard } from "@/lib/demo/demoServices";
import { addDemoAuditLog } from "@/lib/demo/demoStore";
import { useEffect, useState, useMemo } from "react";

export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const actor = getDemoActor();
    if (!actor) return;
    
    setLoading(true);
    setTimeout(() => {
      setData(getDemoManagementDashboard(actor));
      setLoading(false);
    }, 600);
  }, []);

  const handleExport = (reportName: string) => {
    const actor = getDemoActor();
    if (!actor) return;

    // 1. Audit Log
    addDemoAuditLog({
      organizationId: actor.organizationId,
      siteId: actor.siteIds[0],
      userId: actor.id,
      action: "export_report",
      entityType: "report",
      entityId: reportName.toLowerCase().replace(/\s+/g, "_"),
      metadata: { reportName, format: "csv" }
    });

    // 2. Generate CSV
    const headers = ["Label", "Value"];
    const rows = data.metrics.map((m: any) => [m.label, m.value]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `casebridge_report_${reportName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${reportName} exported successfully.`);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Generating report metrics...</div>;
  if (!data) return <div className="p-8 text-center">No reporting data available.</div>;

  const getMetric = (label: string) => data.metrics.find((m: any) => m.label === label)?.value || 0;

  return (
    <AuthGuard allowedRoles={["manager", "admin", "ssa"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Intelligence</h1>
            <p className="text-muted-foreground text-sm">System-wide performance, compliance, and outcome reporting.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("Full Operational")}>
              <Download className="h-4 w-4 mr-2" /> Export All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportMetricCard 
            title="Active Clients" 
            value={getMetric("Active clients")} 
            icon={<Users className="h-4 w-4" />}
            trend={`${getMetric("New intakes")} currently in intake`}
          />
          <ReportMetricCard 
            title="Clients Housed" 
            value={getMetric("Clients housed (MTD)")} 
            icon={<Home className="h-4 w-4" />}
            trend="Month-to-date performance"
            color="text-green-600"
          />
          <ReportMetricCard 
            title="Documentation Gaps" 
            value={getMetric("Documentation gaps")} 
            icon={<FileText className="h-4 w-4" />}
            trend="Files requiring updates"
            color="text-amber-600"
          />
          <ReportMetricCard 
            title="Safety Reviews" 
            value={getMetric("Safety reviews due")} 
            icon={<AlertTriangle className="h-4 w-4" />}
            trend="High priority reviews"
            color="text-red-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Program Snapshot</CardTitle>
              <CardDescription>Breakdown of outcomes and referral statuses.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Housing Outcomes</p>
                  <div className="space-y-3">
                    <SourceItem label="Housed" value={data.housingOutcomes.housed} percentage={Math.round((data.housingOutcomes.housed / data.programSnapshot.totalClients) * 100)} color="bg-green-500" />
                    <SourceItem label="Transferred" value={data.housingOutcomes.transferred} percentage={Math.round((data.housingOutcomes.transferred / data.programSnapshot.totalClients) * 100)} color="bg-blue-500" />
                    <SourceItem label="Discharged" value={data.housingOutcomes.discharged} percentage={Math.round((data.housingOutcomes.discharged / data.programSnapshot.totalClients) * 100)} color="bg-slate-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Referral Statuses</p>
                  <div className="space-y-3">
                    {Object.entries(data.referralOutcomes).map(([status, count]: [string, any]) => (
                      <SourceItem 
                        key={status} 
                        label={status.replace("_", " ").toUpperCase()} 
                        value={count} 
                        percentage={Math.round((count / (getMetric("Referrals made") || 1)) * 100)} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Intake Comp.</p>
                  <p className="text-xl font-bold">{data.documentationCompletion.intake}%</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Housing Plans</p>
                  <p className="text-xl font-bold">{data.documentationCompletion.housing}%</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Service Plans</p>
                  <p className="text-xl font-bold">{data.documentationCompletion.service}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" /> Available Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="divide-y">
                  <ReportLink onClick={() => handleExport("Site Comparison")} title="Site Comparison Report" description="Performance metrics across all locations." />
                  <ReportLink onClick={() => handleExport("Worker Workload")} title="Worker Workload Analysis" description="Cases and tasks per assigned worker." />
                  <ReportLink onClick={() => handleExport("Safety Compliance")} title="Safety Compliance Audit" description="Review of all active safety plans." />
                  <ReportLink onClick={() => handleExport("Documentation Gaps")} title="Documentation Gaps" description="Files requiring missing documentation." />
                  <ReportLink onClick={() => handleExport("Outcomes")} title="Outcomes Report" description="Housing and discharge success tracking." />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" /> Management Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>{data.managementInsights[0]?.message}</p>
                <p className="mt-2">{data.managementInsights[1]?.message}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function ReportMetricCard({ title, value, icon, trend, color }: { title: string; value: number | string; icon: React.ReactNode; trend: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
          <div className="p-1.5 bg-muted rounded-md">{icon}</div>
        </div>
        <div>
          <p className={cn("text-2xl font-bold", color || "text-foreground")}>{value}</p>
          <p className="text-[10px] font-medium text-muted-foreground mt-1">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceItem({ label, value, percentage, color }: { label: string; value: number; percentage: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color || "bg-primary")} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ReportLink({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full p-4 text-left hover:bg-muted/50 transition-colors group">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold group-hover:text-primary transition-colors">{title}</p>
        <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </button>
  );
}
