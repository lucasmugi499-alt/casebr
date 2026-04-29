"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { getDemoManagementDashboard } from "@/lib/demo/demoServices";
import { useEffect, useState, useMemo } from "react";
import { 
  BarChart3, 
  Download, 
  Users, 
  Home, 
  FileCheck, 
  AlertTriangle,
  FileText,
  Filter,
  PieChart,
  LineChart,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const handleExport = (type: string) => {
    toast.success(`Exporting ${type} report to CSV...`);
    // Mock audit log for export
    console.log(`Report exported: ${type}`);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Generating report metrics...</div>;
  if (!data) return <div className="p-8 text-center">No reporting data available.</div>;

  return (
    <AuthGuard allowedRoles={["manager", "admin", "ssa"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Intelligence</h1>
            <p className="text-muted-foreground text-sm">System-wide performance, compliance, and outcome reporting.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("full_operational")}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button size="sm">
              <Filter className="h-4 w-4 mr-2" /> Parameters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportMetricCard 
            title="Active Clients" 
            value={data.metrics.find((m: any) => m.label === "Active clients")?.value || 0} 
            icon={<Users className="h-4 w-4" />}
            trend="+12% from last month"
          />
          <ReportMetricCard 
            title="Clients Housed" 
            value={data.metrics.find((m: any) => m.label === "Clients housed (MTD)")?.value || 0} 
            icon={<Home className="h-4 w-4" />}
            trend="+5 this week"
            color="text-green-600"
          />
          <ReportMetricCard 
            title="Documentation Gaps" 
            value={data.metrics.find((m: any) => m.label === "Documentation gaps")?.value || 0} 
            icon={<FileText className="h-4 w-4" />}
            trend="Attention Required"
            color="text-amber-600"
          />
          <ReportMetricCard 
            title="Safety Reviews" 
            value={data.metrics.find((m: any) => m.label === "Safety reviews due")?.value || 0} 
            icon={<AlertTriangle className="h-4 w-4" />}
            trend="High Priority"
            color="text-red-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Referral & Intake Trends</CardTitle>
              <CardDescription>Breakdown of incoming referrals by type and current status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-end h-32 gap-2">
                  {[45, 32, 56, 41, 67, 48, 52].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/10 rounded-t-sm relative group">
                      <div className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all hover:bg-primary/80" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Top Referral Sources</p>
                  <div className="space-y-2">
                    <SourceItem label="Central Intake" value={42} percentage={45} />
                    <SourceItem label="Street Outreach" value={28} percentage={30} />
                    <SourceItem label="Self-Referral" value={15} percentage={16} />
                    <SourceItem label="Police/EMS" value={8} percentage={9} />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Status Breakdown</p>
                  <div className="space-y-2">
                    <SourceItem label="Active Intake" value={24} percentage={35} color="bg-blue-500" />
                    <SourceItem label="Pending Review" value={18} percentage={25} color="bg-amber-500" />
                    <SourceItem label="Waitlisted" value={32} percentage={40} color="bg-slate-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" /> Reports Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="divide-y">
                  <ReportLink title="Site Comparison Report" description="Performance metrics across all locations." />
                  <ReportLink title="Worker Workload Analysis" description="Cases and tasks per assigned worker." />
                  <ReportLink title="Safety Compliance Audit" description="Review of all active safety plans." />
                  <ReportLink title="SMIS Sync Status" description="Tracking of document copies to SMIS." />
                  <ReportLink title="Funding & Outcomes" description="Grant-related performance indicators." />
                </div>
              </CardContent>
              <div className="p-4 bg-muted/30 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs text-primary">
                  View All Reports <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" /> Compliance Tip
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>94% of clients have completed Intake Assessments. The remaining 6% (12 clients) are overdue for assessment completion.</p>
                <Button variant="link" className="p-0 h-auto text-[10px] mt-2 font-bold uppercase">View Overdue List</Button>
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

function ReportLink({ title, description }: { title: string; description: string }) {
  return (
    <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors group">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold group-hover:text-primary transition-colors">{title}</p>
        <BarChart3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </button>
  );
}
