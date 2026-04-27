"use client";

import AuthGuard from "@/components/AuthGuard";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { clientsService } from "@/lib/services/clientsService";
import { Client } from "@/types";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");

  useEffect(() => {
    if (!user) return;

    clientsService
      .getClientsForUser(user)
      .then(setClients)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    const lower = queryText.toLowerCase();
    return clients.filter((client) => {
      return (
        client.displayName.toLowerCase().includes(lower) ||
        client.clientCode.toLowerCase().includes(lower)
      );
    });
  }, [clients, queryText]);

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">Search and open client records based on your role access.</p>
          </div>
          <Link href="/clients/new" className={buttonVariants()}><Plus className="mr-2 h-4 w-4" />Add Client</Link>
        </div>

        <Card>
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search by client name or code" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading clients…</p>
            ) : !filtered.length ? (
              <p className="text-sm text-muted-foreground">No clients matched your search.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-left">
                    <tr>
                      <th className="p-3">Client</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Last Contact</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => (
                      <tr key={client.id} className="border-b">
                        <td className="p-3">
                          <p className="font-medium">{client.displayName}</p>
                          <p className="text-xs text-muted-foreground">{client.clientCode}</p>
                        </td>
                        <td className="p-3">{client.status}</td>
                        <td className="p-3">{client.priority}</td>
                        <td className="p-3">{client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : "—"}</td>
                        <td className="p-3 text-right">
                          <Link href={`/clients/${client.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open profile</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
