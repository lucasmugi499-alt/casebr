"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewTaskPage() {
  return (
    <AuthGuard>
      <Card>
        <CardHeader><CardTitle>Create follow-up task</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Task creation workflow is available from AI note save options and will be expanded here.</CardContent>
      </Card>
    </AuthGuard>
  );
}
