"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  Building, 
  Home, 
  TrendingUp, 
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileText
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { getDemoActor } from "@/lib/demo/demoMode";
import { 
  getDemoManagementDashboard, 
  getDemoAllSupervisorReviews,
  getDemoClientsForUser
} from "@/lib/demo/demoServices";
import { useEffect, useState, useMemo } from "react";
import { SupervisorReview, Client } from "@/types";
import Link from "next/link";

const monthlyData = [
  { name: 'Jan', new: 12, housed: 4, discharged: 2 },
  { name: 'Feb', new: 19, housed: 6, discharged: 3 },
  { name: 'Mar', new: 15, housed: 8, discharged: 4 },
  { name: 'Apr', new: 22, housed: 10, discharged: 5 },
  { name: 'May', new: 25, housed: 12, discharged: 2 },
  { name: 'Jun', new: 18, housed: 15, discharged: 7 },
];

const referralData = [
  { name: 'Housing', count: 45 },
  { name: 'Income Support', count: 32 },
  { name: 'Mental Health', count: 28 },
  { name: 'Medical', count: 20 },
  { name: 'Legal', count: 12 },
];

export default function ManagementDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<SupervisorReview[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const actor = getDemoActor();
    if (!actor) return;
    
    setLoading(true);
    setTimeout(() => {
      setData(getDemoManagementDashboard(actor));
      setReviews(getDemoAllSupervisorReviews());
      setClients(getDemoClientsForUser(actor));
      setLoading(false);
    }, 500);
  }, []);

  const pendingReviews = useMemo(() => reviews.filter(r => r.status === "pending"), [reviews]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading management data...</div>;
  if (!data) return <div className="p-8 text-center">No data available.</div>;

  return (
    <AuthGuard allowedRoles={["manager", "admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Management Console</h2>
            <p className="text-muted-foreground">Program-level performance and supervisor oversight.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Site: All Locations</Button>
            <Button size="sm">Generate Report</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Case Files</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.metrics.find((m: any) => m.label === "Active clients")?.value}</div>
              <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Housed (MTD)</CardTitle>
              <Home className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.metrics.find((m: any) => m.label === "Clients housed (MTD)")?.value}</div>
              <p className="text-xs text-muted-foreground">Target: 15 per month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews Pending</CardTitle>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews.length}</div>
              <p className="text-xs text-muted-foreground">Action required by you</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doc Compliance</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">82%</div>
              <p className="text-xs text-muted-foreground">Up from 74% last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Performance Overview</TabsTrigger>
            <TabsTrigger value="reviews">Supervisor Review Queue ({pendingReviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Intake vs Outcomes</CardTitle>
                  <CardDescription>Monthly new intakes, housed clients, and other discharges.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="new" name="New Intakes" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        <Line type="monotone" dataKey="housed" name="Housed" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} />
                        <Line type="monotone" dataKey="discharged" name="Other Discharged" stroke="#94a3b8" strokeWidth={2} dot={{r: 3}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Top Referrals</CardTitle>
                  <CardDescription>Most common referral types (YTD).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={referralData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} />
                        <RechartsTooltip 
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" name="Referrals" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Work Queue</CardTitle>
                <CardDescription>Documents and risk flags requiring supervisor approval.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="divide-y">
                  {pendingReviews.length > 0 ? pendingReviews.map(review => (
                    <div key={review.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-full", 
                          review.reviewType === "safety_plan" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {review.reviewType === "safety_plan" ? <ShieldAlert className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm capitalize">{review.reviewType.replace("_", " ")} Review</h4>
                            <Badge variant="secondary" className="text-[10px] uppercase">{review.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Client: <span className="font-medium text-foreground">{clients.find(c => c.id === review.clientId)?.displayName || "Unknown"}</span> • 
                            Submitted by: <span className="font-medium text-foreground">{review.submittedByName}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-4">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Submitted</p>
                          <p className="text-xs">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Link href={`/clients/${review.clientId}?tab=plans`}>
                          <Button size="sm" variant="outline">
                            Review <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-muted-foreground italic">No pending reviews in your queue.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
