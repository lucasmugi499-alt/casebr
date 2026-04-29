"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserPlus, 
  Shield, 
  Mail, 
  MapPin, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDemoStore, addDemoUser, addDemoAuditLog } from "@/lib/demo/demoStore";
import { Role, User, Site } from "@/types";
import { toast } from "sonner";

export default function CreateUserPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<Role>("caseworker");
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [sendInvite, setSendInvite] = useState(true);

  useEffect(() => {
    const store = getDemoStore();
    setSites(store.sites || []);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSiteIds.length === 0 && role !== "admin") {
      toast.error("Please select at least one site for this user.");
      return;
    }

    setLoading(true);

    try {
      // In demo mode
      const newUser: User = {
        id: `demo_user_${Date.now()}`,
        organizationId: currentUser?.organizationId || "demo_org",
        siteIds: selectedSiteIds,
        firstName,
        lastName,
        email,
        role,
        title,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addDemoUser(newUser);
      addDemoAuditLog({
        organizationId: currentUser?.organizationId || "demo_org",
        userId: currentUser?.id || "demo_admin",
        action: "create_user",
        entityType: "user",
        entityId: newUser.id,
        metadata: { firstName, lastName, role, email }
      });

      toast.success(`${firstName} ${lastName} has been added to the system.`);
      router.push("/admin/users");
    } catch (error: any) {
      toast.error(error.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSite = (siteId: string) => {
    setSelectedSiteIds(prev => 
      prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
    );
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Add Staff Member</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                  <CardDescription>Basic profile details for the new staff member.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" required value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input id="email" type="email" required placeholder="name@organization.org" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" required placeholder="e.g. Senior Caseworker" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Site Access</CardTitle>
                  <CardDescription>Select which sites this person can access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sites.map(site => (
                      <div 
                        key={site.id} 
                        className={cn(
                          "flex items-center space-x-3 space-y-0 rounded-md border p-3 cursor-pointer transition-colors",
                          selectedSiteIds.includes(site.id) ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleSite(site.id)}
                      >
                        <Checkbox checked={selectedSiteIds.includes(site.id)} onCheckedChange={() => toggleSite(site.id)} />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">{site.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{site.type}</span>
                        </div>
                      </div>
                    ))}
                    {sites.length === 0 && (
                      <p className="col-span-2 text-sm text-muted-foreground italic p-4 text-center border rounded-md border-dashed">
                        No sites configured. Please create a site first.
                      </p>
                    )}
                  </div>
                  {role !== "admin" && selectedSiteIds.length === 0 && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Non-admin users must be assigned to at least one site.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System Role</CardTitle>
                  <CardDescription>Control access permissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v: any) => setRole(v as Role)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caseworker">Caseworker</SelectItem>
                        <SelectItem value="ssa">SSA / Supervisor</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">System Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-md space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Permissions</p>
                    <ul className="text-xs space-y-1.5 text-slate-600">
                      {role === "caseworker" && (
                        <>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Manage assigned clients</li>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Complete guided workflows</li>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Create case notes</li>
                        </>
                      )}
                      {role === "ssa" && (
                        <>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Assign clients to staff</li>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Review high-risk flags</li>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Oversight of site operations</li>
                        </>
                      )}
                      {role === "manager" && (
                        <>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Access reporting and trends</li>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Performance monitoring</li>
                          <li className="flex items-center gap-2"><div className="h-1 w-1 bg-slate-400 rounded-full" /> Data export capabilities</li>
                        </>
                      )}
                      {role === "admin" && (
                        <>
                          <li className="flex items-center gap-2 font-bold text-slate-900"><div className="h-1 w-1 bg-slate-900 rounded-full" /> Full system configuration</li>
                          <li className="flex items-center gap-2 font-bold text-slate-900"><div className="h-1 w-1 bg-slate-900 rounded-full" /> Manage all user accounts</li>
                          <li className="flex items-center gap-2 font-bold text-slate-900"><div className="h-1 w-1 bg-slate-900 rounded-full" /> View complete audit logs</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3 space-y-0">
                    <Checkbox id="sendInvite" checked={sendInvite} onCheckedChange={(v: boolean) => setSendInvite(v)} />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="sendInvite" className="text-sm font-medium">Send activation email</Label>
                      <p className="text-xs text-muted-foreground">User will receive a secure link to set their password.</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" /> Create User Account</>}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}

import { cn } from "@/lib/utils";
