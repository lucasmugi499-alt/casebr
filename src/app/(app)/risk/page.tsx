"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { riskFlagsService } from "@/lib/services/riskFlagsService";
import { RiskFlag } from "@/types";
import { useEffect, useState } from "react";

export default function RiskPage() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<RiskFlag[]>([]);

  useEffect(() => {
    if (!user) return;
    riskFlagsService.getActiveRiskFlags(user).then(setFlags);
  }, [user]);

  return (
    <AuthGuard allowedRoles={["ssa", "manager", "admin", "caseworker"]}>
      <Card>
        <CardHeader><CardTitle>Risk review list</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {flags.length ? flags.map((flag) => <div key={flag.id} className="rounded border p-3"><p className="font-medium">{flag.category} • {flag.severity}</p><p className="text-xs text-muted-foreground">{flag.description}</p></div>) : <p className="text-sm text-muted-foreground">No active risk flags.</p>}
        </CardContent>
      </Card>
    </AuthGuard>
  );
}
