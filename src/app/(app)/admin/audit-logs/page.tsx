"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { auditLogsService } from "@/lib/services/auditLogsService";
import { AuditLog } from "@/types";
import { useEffect, useState } from "react";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!user) return;
    auditLogsService.getAuditLogs(user, { limitCount: 50 }).then(setLogs);
  }, [user]);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <Card>
        <CardHeader><CardTitle>Audit logs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {logs.length ? logs.map((log) => <div key={log.id} className="rounded border p-3 text-xs"><p className="font-medium">{log.action}</p><p>{log.entityType}: {log.entityId}</p></div>) : <p className="text-sm text-muted-foreground">No audit logs yet.</p>}
        </CardContent>
      </Card>
    </AuthGuard>
  );
}
