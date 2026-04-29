"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { 
  getDemoAllRiskFlags, 
  getDemoAllSafetyPlans, 
  getDemoClientsForUser,
  getDemoAllGeneratedDocuments
} from "@/lib/demo/demoServices";
import { RiskFlag, SafetyPlan, Client, GeneratedDocument } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  User, 
  ArrowRight,
  ShieldCheck,
  FileWarning,
  Activity
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RiskPage() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [safetyPlans, setSafetyPlans] = useState<SafetyPlan[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const actor = getDemoActor();
    if (!actor) return;
    
    setLoading(true);
    // Simulate data loading
    setTimeout(() => {
      setFlags(getDemoAllRiskFlags());
      setSafetyPlans(getDemoAllSafetyPlans());
      setDocuments(getDemoAllGeneratedDocuments());
      setClients(getDemoClientsForUser(actor));
      setLoading(false);
    }, 500);
  }, []);

  const highRiskFlags = useMemo(() => flags.filter(f => f.active && f.severity === "high"), [flags]);
  const activeFlags = useMemo(() => flags.filter(f => f.active), [flags]);
  const safetyReviewsDue = useMemo(() => documents.filter(d => d.type === "safety_plan" && d.status === "review_due"), [documents]);
  const recentIncidents = useMemo(() => flags.filter(f => new Date(f.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000), [flags]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading safety data...</div>;

  return (
    <AuthGuard allowedRoles={["ssa", "manager", "admin", "caseworker"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Safety Command Centre</h1>
            <p className="text-muted-foreground text-sm">Aggregated risk monitoring and safety plan compliance.</p>
          </div>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" /> System Status: Normal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="High Risk Flags" 
            count={highRiskFlags.length} 
            icon={<ShieldAlert className="h-5 w-5 text-red-600" />} 
            description="Active immediate safety concerns"
            color="text-red-600"
          />
          <StatCard 
            title="Safety Reviews Due" 
            count={safetyReviewsDue.length} 
            icon={<FileWarning className="h-5 w-5 text-amber-600" />} 
            description="Plans requiring caseworker update"
            color="text-amber-600"
          />
          <StatCard 
            title="Active Flags" 
            count={activeFlags.length} 
            icon={<AlertTriangle className="h-5 w-5 text-blue-600" />} 
            description="Total documented risks across site"
            color="text-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN LIST: ACTIVE RISK FLAGS */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Active Risk Flags</CardTitle>
                  <CardDescription>Documented behavioral or safety risks requiring awareness.</CardDescription>
                </div>
                <Badge variant="outline">{activeFlags.length} Flags</Badge>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="divide-y">
                  {activeFlags.length > 0 ? activeFlags.map(flag => (
                    <RiskItem 
                      key={flag.id} 
                      flag={flag} 
                      client={clients.find(c => c.id === flag.clientId)} 
                    />
                  )) : (
                    <div className="p-12 text-center text-muted-foreground italic">No active risk flags reported.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR: REVIEWS & RECENT */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" /> Reviews Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {safetyReviewsDue.length > 0 ? safetyReviewsDue.map(doc => (
                  <div key={doc.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-amber-800 uppercase">Review Overdue</p>
                      <Clock className="h-3 w-3 text-amber-600" />
                    </div>
                    <p className="text-sm font-bold">{clients.find(c => c.id === doc.clientId)?.displayName || "Unknown Client"}</p>
                    <p className="text-xs text-amber-700">Safety plan review was due on {doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString() : "N/A"}</p>
                    <Link href={`/clients/${doc.clientId}?tab=plans`}>
                      <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs text-amber-800 hover:bg-amber-100 hover:text-amber-900">
                        Go to Plan <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )) : (
                  <div className="text-center py-4 text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <ShieldCheck className="h-8 w-8 opacity-20 text-green-600" />
                    All safety plans are up to date.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Incidents</CardTitle>
                <CardDescription>Flags added in the last 7 days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentIncidents.map(flag => (
                  <div key={flag.id} className="flex gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="space-y-0.5">
                      <p className="font-medium line-clamp-1">{flag.category}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(flag.createdAt).toLocaleDateString()} • {clients.find(c => c.id === flag.clientId)?.displayName}</p>
                    </div>
                  </div>
                ))}
                {recentIncidents.length === 0 && <p className="text-xs text-muted-foreground italic">No recent incidents recorded.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function StatCard({ title, count, icon, description, color }: { title: string; count: number; icon: React.ReactNode; description: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          {icon}
        </div>
        <div>
          <p className={cn("text-3xl font-bold", color)}>{count}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskItem({ flag, client }: { flag: RiskFlag; client?: Client }) {
  return (
    <div className="p-4 hover:bg-muted/5 transition-colors flex items-start gap-4">
      <div className={cn("p-2 rounded-lg", 
        flag.severity === "high" ? "bg-red-100 text-red-600" : 
        flag.severity === "medium" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
      )}>
        <ShieldAlert className="h-5 w-5" />
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm capitalize">{flag.category.replace("_", " ")}</h4>
            <Badge variant="outline" className={cn("text-[9px] uppercase px-1.5 h-4", 
              flag.severity === "high" ? "border-red-200 text-red-700 bg-red-50" : 
              flag.severity === "medium" ? "border-amber-200 text-amber-700 bg-amber-50" : ""
            )}>
              {flag.severity}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground">{new Date(flag.createdAt).toLocaleDateString()}</span>
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed">{flag.description}</p>
        
        <div className="flex items-center gap-3 pt-1">
          {client && (
            <Link href={`/clients/${client.id}`} className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline uppercase">
              <User className="h-3 w-3" /> {client.displayName} ({client.clientCode})
            </Link>
          )}
          <span className="text-[10px] text-muted-foreground">• ID: {flag.id}</span>
        </div>
      </div>

      <Link href={client ? `/clients/${client.id}` : "#"}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
