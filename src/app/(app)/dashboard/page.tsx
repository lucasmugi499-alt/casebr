"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  Users, 
  AlertCircle, 
  Calendar, 
  Plus, 
  FileText 
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

export default function CaseworkerDashboard() {
  const { user } = useAuth();

  return (
    <AuthGuard allowedRoles={["caseworker"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.firstName}</h2>
          <p className="text-muted-foreground">Here is what is happening with your clients today.</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Link href="/clients/notes/new" className={buttonVariants({ className: "bg-indigo-600 hover:bg-indigo-700" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Case Note
          </Link>
          <Link href="/clients/new" className={buttonVariants({ variant: "outline" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Link>
          <Link href="/tasks/new" className={buttonVariants({ variant: "outline" })}>
            <Plus className="mr-2 h-4 w-4" /> Add Follow-Up
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Clients</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Follow-ups Due Today</CardTitle>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Notes</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Priority Clients</CardTitle>
              <CardDescription>Clients requiring immediate attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for client list */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">AJ</div>
                    <div>
                      <p className="text-sm font-medium leading-none text-red-900">Alex J.</p>
                      <p className="text-sm text-red-600 mt-1">Housing instability flag</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white">View Profile</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Due Follow-ups</CardTitle>
              <CardDescription>Tasks scheduled for today or overdue.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 {/* Placeholder for task list */}
                 <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <div>
                      <p className="text-sm font-medium leading-none">Complete Housing App</p>
                      <p className="text-sm text-muted-foreground mt-1">Due today • Alex J.</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Done</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
