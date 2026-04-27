"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ClientsPage() {
  const { user } = useAuth();

  return (
    <AuthGuard allowedRoles={["Caseworker", "SSA", "Manager"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">Manage and view your assigned clients.</p>
          </div>
          <Link href="/clients/new" className={buttonVariants({ className: "bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Link>
        </div>

        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search by name or code..."
                  className="pl-8 bg-slate-50 w-full md:w-[300px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Client Code/Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Last Contact</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span>Alex J.</span>
                        <span className="text-xs text-slate-500">Code: AJ-450</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">High</span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">Today</td>
                    <td className="px-4 py-4 text-right">
                      <Link href="/clients/c1" className={buttonVariants({ variant: "outline", size: "sm" })}>View Profile</Link>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span>Sarah T.</span>
                        <span className="text-xs text-slate-500">Code: ST-212</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Follow-Up Needed</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">Low</span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">5 days ago</td>
                    <td className="px-4 py-4 text-right">
                      <Link href="/clients/c2" className={buttonVariants({ variant: "outline", size: "sm" })}>View Profile</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
