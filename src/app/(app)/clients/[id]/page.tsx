"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  AlertTriangle, 
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const clientId = params.id as string;

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="text-2xl font-bold tracking-tight">Alex J.</h2>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>
            </div>
            <p className="text-muted-foreground flex items-center">
              Code: AJ-450 <span className="mx-2">•</span> Assigned: Sarah Jenkins
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/clients/notes/new?client=${clientId}`} className={buttonVariants({ size: "sm", className: "bg-indigo-600 hover:bg-indigo-700" })}>
              <FileText className="mr-2 h-4 w-4" /> Add Note
            </Link>
            <Link href={`/tasks/new?client=${clientId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Add Task
            </Link>
            <Link href={`/risk/new?client=${clientId}`} className={buttonVariants({ variant: "outline", size: "sm", className: "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" })}>
              <AlertTriangle className="mr-2 h-4 w-4" /> Add Risk Flag
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-md">Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Date of Birth</span>
                  <span className="font-medium">1990-05-14 (35 y/o)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Goal</span>
                  <span className="font-medium">Secure supportive housing, obtain ID.</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Last Contact</span>
                  <span className="font-medium">Today</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Next Follow-Up</span>
                  <span className="font-medium text-amber-600">Tomorrow</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 shadow-sm">
              <CardHeader className="pb-3 bg-red-50/50 rounded-t-lg border-b border-red-100">
                <CardTitle className="text-md text-red-900 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-red-600" /> 
                  Active Risk Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-red-800">Housing Instability (High)</div>
                  <div className="text-red-600 text-xs mt-1">Client expressed intent to abandon shelter bed.</div>
                </div>
                <Button variant="link" className="p-0 h-auto text-xs text-red-700">View Safety Plan</Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="mt-6">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  
                  {/* Timeline Item 1 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900 text-sm">Case Note Added</div>
                        <time className="text-xs font-medium text-indigo-500">Today, 10:30 AM</time>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">General check-in (In-person)</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">Sarah Jenkins</span>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded flex items-center"><Sparkles className="h-3 w-3 mr-1"/> AI Assisted</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 2 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-red-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-red-100 bg-red-50 shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-red-900 text-sm">Risk Flag Created</div>
                        <time className="text-xs font-medium text-red-500">Yesterday, 2:15 PM</time>
                      </div>
                      <div className="text-sm text-red-700 mb-2">Housing Instability (High Priority)</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-800">Sarah Jenkins</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 3 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900 text-sm">Task Completed</div>
                        <time className="text-xs font-medium text-slate-500">3 days ago</time>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">Income Support App Submitted</div>
                    </div>
                  </div>

                </div>
              </TabsContent>
              
              <TabsContent value="notes">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-500 text-center py-4">Detailed notes view would go here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
