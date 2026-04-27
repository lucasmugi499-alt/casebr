"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <AuthGuard allowedRoles={["manager", "admin", "ssa"]}>
      <Card>
        <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Report generation pages are scaffolded next; exports will write audit logs.</CardContent>
      </Card>
    </AuthGuard>
  );
}
