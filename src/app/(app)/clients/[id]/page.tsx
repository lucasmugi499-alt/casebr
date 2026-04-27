"use client";

import AuthGuard from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { caseNotesService } from "@/lib/services/caseNotesService";
import { clientsService } from "@/lib/services/clientsService";
import { referralsService } from "@/lib/services/referralsService";
import { riskFlagsService } from "@/lib/services/riskFlagsService";
import { tasksService } from "@/lib/services/tasksService";
import { CaseNote, Client, Referral, RiskFlag, Task, TimelineItem } from "@/types";
import { AlertTriangle, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const actor = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
      siteIds: user.siteIds,
    };

    Promise.all([
      clientsService.getClientById(id, actor),
      caseNotesService.getNotesForClient(id, actor),
      tasksService.getTasksForClient(id, actor),
      referralsService.getReferralsForClient(id, actor),
      riskFlagsService.getRiskFlagsForClient(id, actor),
    ])
      .then(([clientRecord, clientNotes, clientTasks, clientReferrals, clientRisk]) => {
        setClient(clientRecord);
        setNotes(clientNotes);
        setTasks(clientTasks);
        setReferrals(clientReferrals);
        setRiskFlags(clientRisk);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const noteItems = notes.map((note) => ({
      id: `note-${note.id}`,
      type: 'case_note' as const,
      date: note.contactDate,
      title: 'Case note',
      summary: note.finalNote,
      staffId: note.authorId,
      entityId: note.id,
      entityType: 'caseNote',
    }));

    const taskItems = tasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'task' as const,
      date: task.updatedAt,
      title: task.title,
      summary: task.description,
      staffId: task.assignedToId,
      entityId: task.id,
      entityType: 'task',
    }));

    const referralItems = referrals.map((referral) => ({
      id: `ref-${referral.id}`,
      type: 'referral' as const,
      date: referral.referralDate,
      title: `${referral.referralType} referral`,
      summary: `${referral.agencyName} • ${referral.status}`,
      staffId: referral.createdById,
      entityId: referral.id,
      entityType: 'referral',
    }));

    const riskItems = riskFlags.map((flag) => ({
      id: `risk-${flag.id}`,
      type: 'risk_flag' as const,
      date: flag.updatedAt,
      title: `${flag.severity} risk flag`,
      summary: flag.description,
      staffId: flag.createdById,
      entityId: flag.id,
      entityType: 'riskFlag',
    }));

    return [...noteItems, ...taskItems, ...referralItems, ...riskItems].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [notes, tasks, referrals, riskFlags]);

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading client record…</p>
      ) : !client ? (
        <Card><CardContent className="py-6">Client not found or access denied.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">{client.displayName}</h2>
                <Badge>{client.status}</Badge>
                <Badge variant="secondary">{client.priority} priority</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{client.clientCode} • Goal: {client.currentGoal || 'Not set yet'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/clients/${client.id}/notes/new`} className={buttonVariants({ size: "sm" })}><FileText className="mr-2 h-4 w-4" />Add note</Link>
              <Link href={`/risk/new?client=${client.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}><AlertTriangle className="mr-2 h-4 w-4" />Add risk flag</Link>
            </div>
          </div>

          <Tabs defaultValue="timeline">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client timeline</CardTitle>
                  <CardDescription>Combined activity across notes, tasks, referrals, and risk flags.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!timeline.length ? (
                    <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {timeline.map((item) => (
                        <div key={item.id} className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()} • {item.type}</p>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4"><Card><CardContent className="py-5 text-sm">{notes.length} note(s) recorded.</CardContent></Card></TabsContent>
            <TabsContent value="tasks" className="mt-4"><Card><CardContent className="py-5 text-sm">{tasks.length} task(s) linked to this client.</CardContent></Card></TabsContent>
            <TabsContent value="referrals" className="mt-4"><Card><CardContent className="py-5 text-sm">{referrals.length} referral(s) linked to this client.</CardContent></Card></TabsContent>
          </Tabs>
        </div>
      )}
    </AuthGuard>
  );
}
