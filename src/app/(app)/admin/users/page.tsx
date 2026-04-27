"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Role, Site } from "@/types";

const ROLES: Role[] = ["caseworker", "ssa", "manager", "admin"];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  title: string;
  siteIds: string[];
  temporaryPassword: string;
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  role: "caseworker",
  title: "",
  siteIds: [],
  temporaryPassword: "",
};

export default function AdminUsersDashboard() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSites = async () => {
      if (!user?.organizationId) {
        return;
      }

      const snapshot = await getDocs(
        query(collection(db, "sites"), where("organizationId", "==", user.organizationId))
      );
      setSites(snapshot.docs.map((entry) => entry.data() as Site));
    };

    loadSites().catch((error) => {
      toast.error(error instanceof Error ? error.message : "Failed to load sites.");
    });
  }, [user?.organizationId]);

  const canSubmit = useMemo(
    () => form.firstName && form.lastName && form.email && form.title && form.siteIds.length > 0,
    [form]
  );

  const submit = async () => {
    if (!canSubmit || !auth.currentUser) {
      return;
    }

    setSubmitting(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          temporaryPassword: form.temporaryPassword || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Failed to create user");
      }

      toast.success("Staff account created.");
      if (result.resetLink) {
        toast.info("Password reset link generated in API response.");
      }
      setForm(EMPTY_FORM);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">Create staff accounts using secure server-side admin APIs.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Staff User</CardTitle>
            <CardDescription>Only admins can create users. Firestore profiles always match Firebase Auth UID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Site access</Label>
              <div className="space-y-2 rounded-md border p-3">
                {sites.map((site) => (
                  <label key={site.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.siteIds.includes(site.id)}
                      onChange={(e) => {
                        setForm((state) => ({
                          ...state,
                          siteIds: e.target.checked
                            ? [...state.siteIds, site.id]
                            : state.siteIds.filter((id) => id !== site.id),
                        }));
                      }}
                    />
                    {site.name} ({site.id})
                  </label>
                ))}
                {!sites.length && <p className="text-sm text-slate-500">No sites found for this organization.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Temporary password (optional)</Label>
              <Input
                type="password"
                value={form.temporaryPassword}
                onChange={(e) => setForm((s) => ({ ...s, temporaryPassword: e.target.value }))}
                placeholder="If blank, a random temporary password is generated"
              />
            </div>

            <Button disabled={!canSubmit || submitting} onClick={submit} className="bg-indigo-600 hover:bg-indigo-700">
              {submitting ? "Creating..." : "Create staff account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
