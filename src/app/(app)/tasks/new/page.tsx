"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { addDemoTask } from "@/lib/demo/demoStore";
import { getDemoClientsForUser } from "@/lib/demo/demoServices";
import { Client, Priority } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NewTaskPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientId: initialClientId,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: "medium" as Priority
  });

  useEffect(() => {
    const actor = getDemoActor();
    if (actor) {
      setClients(getDemoClientsForUser(actor));
    }
  }, []);

  const handleSubmit = async () => {
    const actor = getDemoActor();
    if (!actor) return;

    if (!formData.title || !formData.clientId) {
      toast.error("Please fill in required fields.");
      return;
    }

    setSaving(true);
    try {
      const selectedClient = clients.find(c => c.id === formData.clientId);
      
      addDemoTask({
        id: `task_${Date.now()}`,
        organizationId: actor.organizationId,
        siteId: selectedClient?.siteId || actor.siteIds?.[0] || "site-1",
        clientId: formData.clientId,
        assignedToId: actor.id,
        createdById: actor.id,
        title: formData.title,
        description: formData.description,
        dueDate: new Date(formData.dueDate).toISOString(),
        priority: formData.priority,
        status: "open",
      });

      toast.success("Task created.");
      router.push(formData.clientId ? `/clients/${formData.clientId}?tab=actions` : "/tasks");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Follow-up Task</h1>
            <p className="text-muted-foreground text-sm">Schedule a manual action or document review.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Task Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title <span className="text-destructive">*</span></Label>
              <Input 
                id="title" 
                placeholder="e.g. Call landlord for update" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Related Client <span className="text-destructive">*</span></Label>
                <Select value={formData.clientId} onValueChange={v => setFormData({...formData, clientId: v ?? ""})}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: (v ?? "medium") as any})}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Instructions</Label>
              <Textarea 
                id="description" 
                placeholder="Optional details or context..." 
                className="min-h-[100px]"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Creating..." : "Create Task"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}
