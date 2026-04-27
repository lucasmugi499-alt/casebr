"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { tasksService } from "@/lib/services/tasksService";
import { Task } from "@/types";
import { useEffect, useState } from "react";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) return;
    tasksService.getTasksForUser(user).then(setTasks);
  }, [user]);

  return (
    <AuthGuard>
      <Card>
        <CardHeader><CardTitle>My tasks</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {tasks.length ? tasks.map((task) => <div key={task.id} className="rounded border p-3"><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.status} • due {new Date(task.dueDate).toLocaleDateString()}</p></div>) : <p className="text-sm text-muted-foreground">No tasks assigned.</p>}
        </CardContent>
      </Card>
    </AuthGuard>
  );
}
