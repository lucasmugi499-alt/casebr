"use client";

import { useState, useEffect, useMemo } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Edit,
  Users,
  Map,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { getDemoStore, updateDemoSite } from "@/lib/demo/demoStore";
import { Site } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SiteManagementPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const refreshSites = () => {
    const store = getDemoStore();
    setSites(store.sites || []);
    setLoading(false);
  };

  useEffect(() => {
    refreshSites();
  }, []);

  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || s.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [sites, search, typeFilter]);

  const toggleSiteStatus = (site: Site) => {
    const newStatus = site.status === "active" ? "inactive" : "active";
    updateDemoSite(site.id, { status: newStatus });
    toast.success(`Site ${site.name} is now ${newStatus}.`);
    refreshSites();
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Site Management</h1>
            <p className="text-muted-foreground">Manage shelters, drop-in centres, and outreach programs.</p>
          </div>
          <Link href="/admin/sites/new" className={buttonVariants({ variant: "default" })}>
            <Plus className="h-4 w-4 mr-2" /> Add New Site
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sites..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select 
                  className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="shelter">Emergency Shelter</option>
                  <option value="drop_in">Drop-In Centre</option>
                  <option value="housing">Housing</option>
                  <option value="outreach">Outreach</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-bold">Site Name</th>
                    <th className="px-6 py-3 font-bold">Type</th>
                    <th className="px-6 py-3 font-bold">Location</th>
                    <th className="px-6 py-3 font-bold text-center">Status</th>
                    <th className="px-6 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSites.length > 0 ? filteredSites.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">ID: {s.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-slate-100">
                          {s.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>Toronto, ON</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={s.status === "active" ? "default" : "secondary"} className={cn(
                          "text-[10px] uppercase font-bold",
                          s.status === "active" ? "bg-green-600" : "bg-slate-400"
                        )}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/sites/${s.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 w-8 p-0" })}>
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-8 w-8 p-0", s.status === "active" ? "text-destructive" : "text-green-600")}
                            onClick={() => toggleSiteStatus(s)}
                          >
                            {s.status === "active" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                        No sites found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 py-3 border-t">
            <p className="text-xs text-muted-foreground">Total: {filteredSites.length} operating sites</p>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}
