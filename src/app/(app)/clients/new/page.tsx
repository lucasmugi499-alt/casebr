"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { clientsService } from "@/lib/services/clientsService";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewClientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [siteId, setSiteId] = useState("");

  const submit = async () => {
    if (!user || !displayName || !siteId) return;

    const client = await clientsService.createClient(
      {
        organizationId: user.organizationId,
        siteId,
        displayName,
        clientCode: `CB-${Math.floor(Math.random() * 99999)}`,
        assignedWorkerIds: [user.id],
        status: "intake",
        priority: "medium",
        currentGoal: "Initial case planning",
        createdById: user.id,
      },
      user
    );

    toast.success("Client created.");
    router.push(`/clients/${client.id}`);
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "admin"]}>
      <Card>
        <CardHeader><CardTitle>New client</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Display name</Label><Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div>
          <div><Label>Site ID</Label><Input value={siteId} onChange={(event) => setSiteId(event.target.value)} placeholder="Enter assigned site id" /></div>
        </CardContent>
        <CardFooter><Button onClick={submit}>Create client</Button></CardFooter>
      </Card>
    </AuthGuard>
  );
}
