"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { sitesService } from "@/lib/services/sitesService";
import { Site } from "@/types";
import { useEffect, useState } from "react";

export default function AdminSitesPage() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    if (!user) return;
    sitesService.getSitesByOrganization(user.organizationId).then(setSites);
  }, [user]);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <Card>
        <CardHeader><CardTitle>Sites</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {sites.length ? sites.map((site) => <div key={site.id} className="rounded border p-3">{site.name}</div>) : <p className="text-sm text-muted-foreground">No sites found.</p>}
        </CardContent>
      </Card>
    </AuthGuard>
  );
}
