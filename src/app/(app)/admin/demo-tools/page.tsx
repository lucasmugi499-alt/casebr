"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  Database, 
  Trash2, 
  RefreshCw, 
  Users, 
  FileText, 
  History, 
  AlertTriangle,
  Zap,
  Code
} from "lucide-react";
import { getDemoStore, exitDemoMode } from "@/lib/demo/demoStore";
import { toast } from "sonner";

export default function DemoToolsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const store = getDemoStore();
    setStats({
      users: store.users?.length || 0,
      clients: store.clients?.length || 0,
      notes: store.caseNotes?.length || 0,
      tasks: store.tasks?.length || 0,
      referrals: store.referrals?.length || 0,
      docs: store.generatedDocuments?.length || 0,
      logs: store.auditLogs?.length || 0,
    });
  }, []);

  const resetData = () => {
    if (confirm("Reset all demo data to factory defaults? All session changes will be lost.")) {
      localStorage.removeItem("casebridge_demo_store_v1");
      window.location.reload();
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Demo & Dev Tools</h1>
            <p className="text-muted-foreground">Manage the local demo state and session configuration.</p>
          </div>
          <Badge variant="destructive" className="h-6 uppercase font-bold tracking-widest px-3">Development Only</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* STORE SUMMARY */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Demo Store Summary</CardTitle>
              </div>
              <CardDescription>Current items in local storage session.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem label="Users" value={stats?.users || 0} icon={<Users className="h-3.5 w-3.5" />} />
                <StatItem label="Clients" value={stats?.clients || 0} icon={<Users className="h-3.5 w-3.5" />} />
                <StatItem label="Case Notes" value={stats?.notes || 0} icon={<FileText className="h-3.5 w-3.5" />} />
                <StatItem label="Tasks" value={stats?.tasks || 0} icon={<Zap className="h-3.5 w-3.5" />} />
                <StatItem label="Referrals" value={stats?.referrals || 0} icon={<RefreshCw className="h-3.5 w-3.5" />} />
                <StatItem label="Documents" value={stats?.docs || 0} icon={<FileText className="h-3.5 w-3.5" />} />
                <StatItem label="Audit Logs" value={stats?.logs || 0} icon={<History className="h-3.5 w-3.5" />} colSpan={2} />
              </div>
            </CardContent>
          </Card>

          {/* DANGEROUS ACTIONS */}
          <Card className="border-destructive/20 shadow-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                <CardTitle className="text-lg">State Management</CardTitle>
              </div>
              <CardDescription>Destructive actions for testing purposes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10 space-y-3">
                  <h4 className="text-sm font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Reset Demo State
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This will purge your current browser's local storage and restore CaseBridge to its initial demo state.
                  </p>
                  <Button variant="destructive" size="sm" className="w-full font-bold uppercase tracking-tight text-[10px]" onClick={resetData}>
                    Purge & Factory Reset
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" /> Configuration Export
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Download current session data as a JSON file for debugging or seeding.
                  </p>
                  <Button variant="outline" size="sm" className="w-full font-bold uppercase tracking-tight text-[10px]" onClick={() => {
                    const data = JSON.stringify(getDemoStore(), null, 2);
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `casebridge_demo_export_${new Date().toISOString()}.json`;
                    a.click();
                  }}>
                    Export Local Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECURITY WARNING */}
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl flex gap-4 items-start shadow-sm">
          <div className="bg-amber-100 p-2 rounded-full text-amber-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-amber-900">Security Requirement: Production Visibility</h3>
            <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
              Demo tools and role-bypass controls are strictly development-only features. Ensure that the <code>isDemoMode()</code> and <code>process.env.NODE_ENV</code> checks are correctly implemented in your middleware and page-level auth guards before deploying to production.
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function StatItem({ label, value, icon, colSpan = 1 }: { label: string, value: number, icon: React.ReactNode, colSpan?: number }) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-muted/30 border space-y-1",
      colSpan === 2 ? "col-span-2" : "col-span-1"
    )}>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
