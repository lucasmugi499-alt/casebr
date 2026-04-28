"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { addDemoTimelineItem, addDemoTask, upsertDemoGeneratedDocument } from "@/lib/demo/demoStore";
import { clientsService } from "@/lib/services/clientsService";
import { generateHousingPlanText, HousingPlanAnswers } from "@/lib/casework/housingPlanGenerator";
import { Client, GeneratedDocument } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const steps = ["Housing Goal", "Current Situation", "Income", "Documents", "Applications", "Barriers", "Strengths", "Action Plan", "Review"];

export default function NewHousingPlanPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<HousingPlanAnswers>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(`housing_plan_draft_${id}`);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as HousingPlanAnswers;
    } catch {
      return {};
    }
  });
  const [clientName, setClientName] = useState("Client");
  const [clientCode, setClientCode] = useState("");
  const [generated, setGenerated] = useState("");

  const storageKey = useMemo(() => `housing_plan_draft_${id}`, [id]);

  useEffect(() => {
    if (!user) return;
    clientsService.getClientById(id, { id: user.id, organizationId: user.organizationId, role: user.role, siteIds: user.siteIds }).then((client) => {
      if (client) {
        setClientName(client.displayName);
        setClientCode(client.clientCode);
      }
    });
  }, [id, storageKey, user]);

  const setField = (key: keyof HousingPlanAnswers, value: string) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const saveDraft = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  };

  const generate = () => {
    if (!user) return;
    const client: Client = {
      id,
      displayName: clientName,
      clientCode,
      organizationId: user.organizationId,
      siteId: user.siteIds[0] ?? "site_downtown",
      assignedWorkerIds: [user.id],
      status: "active",
      priority: "medium",
      currentGoal: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdById: user.id,
    };
    setGenerated(generateHousingPlanText(client, `${user.firstName} ${user.lastName}`, client.siteId, answers));
    setStep(steps.length - 1);
  };

  const saveToClientFile = () => {
    const actor = getDemoActor();
    if (!actor || !generated) return;
    const docId = `doc_housing_${id}`;
    const document: GeneratedDocument = {
      id: docId,
      clientId: id,
      organizationId: actor.organizationId,
      siteId: actor.siteIds[0] ?? "site_downtown",
      type: "housing_plan",
      title: `Housing Plan - ${clientName}`,
      status: "completed",
      generatedText: generated,
      sourceAnswers: answers as Record<string, unknown>,
      createdById: actor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewDate: answers.reviewDate,
    };
    upsertDemoGeneratedDocument(document);
    if ((answers.createTask ?? "").toLowerCase().startsWith("y")) {
      addDemoTask({
        id: `demo_task_${crypto.randomUUID()}`,
        organizationId: actor.organizationId,
        siteId: actor.siteIds[0] ?? "site_downtown",
        clientId: id,
        assignedToId: actor.id,
        createdById: actor.id,
        title: answers.nextAction || "Housing follow-up",
        description: "Auto-created from Housing Plan completion.",
        dueDate: answers.dueDate || new Date().toISOString(),
        priority: "high",
        status: "open",
      });
    }
    addDemoTimelineItem({
      id: `timeline_${crypto.randomUUID()}`,
      type: "housing_plan",
      date: new Date().toISOString(),
      title: "Housing Plan completed",
      summary: "SMIS-ready housing plan generated and saved to client file.",
      staffId: actor.id,
      entityId: `${id}:housing_plan:${docId}`,
      entityType: "generatedDocument",
      relatedWorkstream: "housing",
      status: "completed",
    });
    window.localStorage.removeItem(storageKey);
    router.push(`/clients/${id}`);
  };

  return (
    <AuthGuard allowedRoles={["caseworker"]}>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Housing Plan Wizard</h2>
          <p className="text-muted-foreground">Guided workflow for practical housing planning and SMIS-ready documentation.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Step {step + 1} of {steps.length}: {steps[step]}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {step === 0 && <><Label>Current housing goal</Label><Textarea value={answers.housingGoal ?? ""} onChange={(e) => setField("housingGoal", e.target.value)} /><Label>Housing type sought</Label><Input value={answers.housingType ?? ""} onChange={(e) => setField("housingType", e.target.value)} /></>}
            {step === 1 && <><Label>Current stay</Label><Input value={answers.currentStay ?? ""} onChange={(e) => setField("currentStay", e.target.value)} /><Label>What led to instability?</Label><Textarea value={answers.housingInstabilityReason ?? ""} onChange={(e) => setField("housingInstabilityReason", e.target.value)} /></>}
            {step === 2 && <><Label>Income source</Label><Input value={answers.incomeSource ?? ""} onChange={(e) => setField("incomeSource", e.target.value)} /><Label>Monthly income</Label><Input value={answers.monthlyIncome ?? ""} onChange={(e) => setField("monthlyIncome", e.target.value)} /></>}
            {step === 3 && <><Label>Document status</Label><Textarea value={answers.documentStatus ?? ""} onChange={(e) => setField("documentStatus", e.target.value)} /><Label>Missing documents</Label><Input value={answers.missingDocuments ?? ""} onChange={(e) => setField("missingDocuments", e.target.value)} /></>}
            {step === 4 && <><Label>Applications / agencies involved</Label><Textarea value={answers.agenciesInvolved ?? ""} onChange={(e) => setField("agenciesInvolved", e.target.value)} /><Label>Pending applications</Label><Input value={answers.pendingApplications ?? ""} onChange={(e) => setField("pendingApplications", e.target.value)} /></>}
            {step === 5 && <><Label>Barriers to housing</Label><Textarea value={answers.barriers ?? ""} onChange={(e) => setField("barriers", e.target.value)} /><Label>Main barrier</Label><Input value={answers.mainBarrier ?? ""} onChange={(e) => setField("mainBarrier", e.target.value)} /></>}
            {step === 6 && <><Label>Strengths</Label><Textarea value={answers.strengths ?? ""} onChange={(e) => setField("strengths", e.target.value)} /><Label>Supports</Label><Input value={answers.supports ?? ""} onChange={(e) => setField("supports", e.target.value)} /></>}
            {step === 7 && <><Label>Next action</Label><Textarea value={answers.nextAction ?? ""} onChange={(e) => setField("nextAction", e.target.value)} /><Label>Responsible</Label><Input value={answers.responsible ?? ""} onChange={(e) => setField("responsible", e.target.value)} /><Label>Due date</Label><Input type="date" value={answers.dueDate ?? ""} onChange={(e) => setField("dueDate", e.target.value)} /><Label>Create follow-up task? (yes/no)</Label><Input value={answers.createTask ?? ""} onChange={(e) => setField("createTask", e.target.value)} /></>}
            {step === 8 && <><Label>Generated Housing Plan (preview)</Label><Textarea value={generated} onChange={(e) => setGenerated(e.target.value)} className="min-h-72" /><div className="flex flex-wrap gap-2"><Button onClick={() => navigator.clipboard.writeText(generated)}>Copy for SMIS</Button><Button onClick={saveToClientFile}>Save to Client File</Button><Link href={`/clients/${id}`} className={buttonVariants({ variant: "outline" })}>Return to Client Work File</Link></div></>}

            <div className="flex flex-wrap gap-2 pt-3">
              {step > 0 && <Button variant="outline" onClick={() => setStep((v) => v - 1)}>Back</Button>}
              <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
              {step < steps.length - 2 && <Button onClick={() => setStep((v) => v + 1)}>Next</Button>}
              {step < steps.length - 1 && <Button onClick={generate}>Finish Plan</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
