"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { getDemoTasksForUser, getDemoClientsForUser } from "@/lib/demo/demoServices";
import { updateDemoTask } from "@/lib/demo/demoStore";
import { Task, Client } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  User, 
  ArrowRight,
  Filter,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    const actor = getDemoActor();
    if (!actor) return;
    
    setLoading(true);
    // Simulate data loading
    setTimeout(() => {
      setTasks(getDemoTasksForUser(actor));
      setClients(getDemoClientsForUser(actor));
      setLoading(false);
    }, 500);
  }, []);

  const handleToggleComplete = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "open" : "completed";
    const updated = updateDemoTask(taskId, { status: newStatus as any });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      toast.success(newStatus === "completed" ? "Task marked as complete" : "Task reopened");
    }
  };

  const overdue = useMemo(() => tasks.filter(t => t.status !== "completed" && new Date(t.dueDate).getTime() < nowMs), [tasks, nowMs]);
  const today = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return tasks.filter(t => t.status !== "completed" && t.dueDate.startsWith(todayStr));
  }, [tasks]);
  const upcoming = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return tasks.filter(t => t.status !== "completed" && t.dueDate > todayStr && !today.some(td => td.id === t.id));
  }, [tasks, today]);
  const completed = useMemo(() => tasks.filter(t => t.status === "completed"), [tasks]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Task Command Centre</h1>
            <p className="text-muted-foreground text-sm">Manage your follow-ups, document reviews, and client actions.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
            <Button size="sm">
              <Calendar className="h-4 w-4 mr-2" /> Schedule View
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Overdue" count={overdue.length} icon={<AlertCircle className="h-4 w-4 text-red-600" />} color="text-red-600" />
          <StatCard title="Due Today" count={today.length} icon={<Clock className="h-4 w-4 text-amber-600" />} color="text-amber-600" />
          <StatCard title="Upcoming" count={upcoming.length} icon={<Calendar className="h-4 w-4 text-blue-600" />} color="text-blue-600" />
          <StatCard title="Completed" count={completed.length} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} color="text-green-600" />
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="h-10">
            <TabsTrigger value="pending">Pending Tasks ({overdue.length + today.length + upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="pt-4 space-y-6">
            {overdue.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Overdue
                </h3>
                <div className="grid gap-3">
                  {overdue.map(task => <TaskItem key={task.id} task={task} client={clients.find(c => c.id === task.clientId)} onToggle={handleToggleComplete} />)}
                </div>
              </section>
            )}

            {(today.length > 0 || upcoming.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Upcoming
                </h3>
                <div className="grid gap-3">
                  {[...today, ...upcoming].map(task => <TaskItem key={task.id} task={task} client={clients.find(c => c.id === task.clientId)} onToggle={handleToggleComplete} />)}
                </div>
              </section>
            )}

            {tasks.filter(t => t.status !== "completed").length === 0 && (
              <div className="py-20 text-center border-2 border-dashed rounded-xl space-y-2">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto opacity-50" />
                <p className="font-medium text-muted-foreground">All tasks completed! You're caught up.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="pt-4">
            <div className="grid gap-3">
              {completed.map(task => <TaskItem key={task.id} task={task} client={clients.find(c => c.id === task.clientId)} onToggle={handleToggleComplete} />)}
              {completed.length === 0 && <p className="text-center py-12 text-muted-foreground italic">No completed tasks yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

function StatCard({ title, count, icon, color }: { title: string; count: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
          <p className={cn("text-2xl font-bold", color)}>{count}</p>
        </div>
        <div className="p-2 bg-muted rounded-full">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ task, client, onToggle }: { task: Task; client?: Client; onToggle: (id: string, status: string) => void }) {
  const isOverdue = task.status !== "completed" && new Date(task.dueDate).getTime() < Date.now();
  
  return (
    <Card className={cn("transition-all hover:border-primary/50", task.status === "completed" ? "opacity-60 bg-muted/30" : "")}>
      <CardContent className="p-4 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-8 w-8 rounded-full border-2", task.status === "completed" ? "bg-green-100 border-green-500 text-green-600" : "border-muted-foreground/30")}
          onClick={() => onToggle(task.id, task.status)}
        >
          {task.status === "completed" && <CheckCircle2 className="h-5 w-5" />}
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn("font-bold text-sm truncate", task.status === "completed" ? "line-through text-muted-foreground" : "")}>
              {task.title}
            </h4>
            <Badge variant="outline" className={cn("text-[9px] uppercase px-1.5 h-4", 
              task.priority === "high" ? "border-red-200 text-red-700 bg-red-50" : 
              task.priority === "medium" ? "border-amber-200 text-amber-700 bg-amber-50" : ""
            )}>
              {task.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
          
          <div className="flex items-center gap-4 mt-2">
            {client && (
              <Link href={`/clients/${client.id}`} className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline uppercase">
                <User className="h-3 w-3" /> {client.displayName}
              </Link>
            )}
            <div className={cn("flex items-center gap-1.5 text-[10px] font-medium", isOverdue ? "text-red-600" : "text-muted-foreground")}>
              <Clock className="h-3 w-3" /> Due {new Date(task.dueDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <Link href={client ? `/clients/${client.id}` : "#"}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
