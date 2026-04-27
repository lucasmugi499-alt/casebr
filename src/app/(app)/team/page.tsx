"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  AlertCircle, 
  Calendar, 
  CheckCircle2,
  FileText
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

export default function TeamDashboard() {
  const { user } = useAuth();

  return (
    <AuthGuard allowedRoles={["SSA", "Manager", "Admin"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Overview</h2>
          <p className="text-muted-foreground">Monitor team workload and high-priority clients.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notes Today</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Clients</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Staff Workload</CardTitle>
              <CardDescription>Overview of caseworker activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Caseworker</th>
                      <th className="px-4 py-3">Clients</th>
                      <th className="px-4 py-3">Notes (Wk)</th>
                      <th className="px-4 py-3">Overdue</th>
                      <th className="px-4 py-3 rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium">Sarah Jenkins</td>
                      <td className="px-4 py-3">12</td>
                      <td className="px-4 py-3">18</td>
                      <td className="px-4 py-3 text-amber-600">2</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Balanced</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium">Mike Chen</td>
                      <td className="px-4 py-3">15</td>
                      <td className="px-4 py-3">8</td>
                      <td className="px-4 py-3 text-red-600">5</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">High</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Client Attention List</CardTitle>
              <CardDescription>Clients needing review.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 <div className="flex flex-col p-3 border rounded-lg border-red-100 bg-red-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium leading-none text-red-900">David M.</p>
                      <p className="text-xs text-red-600 mt-1">No contact in 8 days</p>
                    </div>
                    <span className="text-xs text-slate-500">Mike C.</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 bg-white w-full">Review Timeline</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
