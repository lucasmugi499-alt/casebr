"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Card>
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Organization and user settings will be managed here.</CardContent>
      </Card>
    </AuthGuard>
  );
}
