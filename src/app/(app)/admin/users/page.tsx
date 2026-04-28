"use client";

import { useState, useEffect, useMemo } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Edit,
  History,
  Lock,
  ArrowUpDown
} from "lucide-react";
import Link from "next/link";
import { getDemoStore, updateDemoUser } from "@/lib/demo/demoStore";
import { User, Role } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const refreshUsers = () => {
    // In demo mode
    const store = getDemoStore();
    setUsers(store.users);
    setLoading(false);
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.firstName.toLowerCase().includes(search.toLowerCase()) || 
        u.lastName.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const toggleUserStatus = (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    
    // Safety check for last admin
    if (user.role === "admin" && user.status === "active") {
      const activeAdmins = users.filter(u => u.role === "admin" && u.status === "active");
      if (activeAdmins.length <= 1) {
        toast.error("Cannot deactivate the last active administrator.");
        return;
      }
    }

    updateDemoUser(user.id, { status: newStatus });
    toast.success(`User ${user.firstName} is now ${newStatus}.`);
    refreshUsers();
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage staff accounts, roles, and site access.</p>
          </div>
          <Link href="/admin/users/new" className={buttonVariants({ variant: "default" })}>
            <UserPlus className="h-4 w-4 mr-2" /> Add Staff Member
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select 
                  className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                >
                  <option value="all">All Roles</option>
                  <option value="caseworker">Caseworker</option>
                  <option value="ssa">SSA / Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <select 
                  className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-bold">Staff Member</th>
                    <th className="px-6 py-3 font-bold">Role & Title</th>
                    <th className="px-6 py-3 font-bold">Site Access</th>
                    <th className="px-6 py-3 font-bold text-center">Status</th>
                    <th className="px-6 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase font-bold",
                            u.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                            u.role === "manager" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            u.role === "ssa" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-green-50 text-green-700 border-green-200"
                          )}>
                            {u.role.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{u.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.siteIds?.length > 0 ? u.siteIds.map(sid => (
                            <Badge key={sid} variant="secondary" className="text-[9px] py-0 h-4 bg-slate-100 text-slate-600 border-slate-200">
                              {sid}
                            </Badge>
                          )) : (
                            <span className="text-xs text-muted-foreground">All Sites</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={u.status === "active" ? "default" : "secondary"} className={cn(
                          "text-[10px] uppercase font-bold",
                          u.status === "active" ? "bg-green-600" : "bg-slate-400"
                        )}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/users/${u.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 w-8 p-0" })}>
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-8 w-8 p-0", u.status === "active" ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600")}
                            onClick={() => toggleUserStatus(u)}
                          >
                            {u.status === "active" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                        No users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 py-3 border-t">
            <p className="text-xs text-muted-foreground">Total: {filteredUsers.length} staff members</p>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}
