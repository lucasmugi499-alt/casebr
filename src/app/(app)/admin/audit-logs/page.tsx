"use client";

import { useState, useEffect, useMemo } from "react";
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  Activity, 
  Clock, 
  Eye, 
  ShieldCheck,
  Calendar,
  Building2,
  Info
} from "lucide-react";
import { getDemoStore } from "@/lib/demo/demoStore";
import { AuditLog } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    const store = getDemoStore();
    setLogs(store.auditLogs || []);
    setLoading(false);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = 
        l.userId.toLowerCase().includes(search.toLowerCase()) || 
        l.action.toLowerCase().includes(search.toLowerCase()) || 
        l.entityType.toLowerCase().includes(search.toLowerCase());
      const matchesAction = actionFilter === "all" || l.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(l => l.action));
    return Array.from(actions).sort();
  }, [logs]);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
            <p className="text-muted-foreground">Immutable history of system actions and data changes.</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export Logs
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or action..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select 
                  className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action.replace(/_/g, " ").toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-bold">Timestamp</th>
                    <th className="px-6 py-3 font-bold">User</th>
                    <th className="px-6 py-3 font-bold">Action</th>
                    <th className="px-6 py-3 font-bold">Target</th>
                    <th className="px-6 py-3 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.length > 0 ? filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{new Date(l.timestamp).toLocaleDateString()}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{new Date(l.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{l.userId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "text-[9px] uppercase font-bold py-0 h-5",
                          l.action.startsWith("create") ? "bg-green-50 text-green-700 border-green-200" :
                          l.action.startsWith("delete") || l.action.includes("deactivate") ? "bg-destructive/10 text-destructive border-destructive/20" :
                          l.action.startsWith("update") ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                          {l.action.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[11px] text-slate-700">{l.entityType.toUpperCase()}</span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{l.entityId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                          toast.info(`Metadata: ${JSON.stringify(l.metadata, null, 2)}`, {
                            duration: 5000,
                          });
                        }}>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                        No audit logs found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 py-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Audit logs are tamper-resistant and read-only.</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}
