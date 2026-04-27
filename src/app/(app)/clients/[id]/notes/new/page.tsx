"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateCaseNote } from "@/app/actions/ai";
import { useAuth } from "@/contexts/AuthContext";
import { caseNotesService } from "@/lib/services/caseNotesService";
import { clientsService } from "@/lib/services/clientsService";
import { referralsService } from "@/lib/services/referralsService";
import { riskFlagsService } from "@/lib/services/riskFlagsService";
import { tasksService } from "@/lib/services/tasksService";
import { ContactType, NoteCategory } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  contactDate: z.string().min(1),
  contactType: z.string().min(1),
  location: z.string().optional(),
  category: z.string().min(1),
  roughSummary: z.string().min(10),
  actionsTaken: z.string().optional(),
  referralsMade: z.string().optional(),
  followUpRequired: z.boolean(),
  riskSafetyConcerns: z.string().optional(),
  finalNote: z.string().min(20),
  createFollowUpTask: z.boolean(),
  createReferral: z.boolean(),
  createRiskFlag: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const contactTypes: ContactType[] = [
  "in_person",
  "phone",
  "email",
  "outreach",
  "appointment_accompaniment",
  "case_conference",
  "crisis_support",
  "informal_check_in",
  "referral_support",
  "housing_support",
];

const categories: NoteCategory[] = [
  "general_check_in",
  "housing",
  "income_support",
  "identification",
  "mental_health",
  "substance_use",
  "safety_planning",
  "medical_health",
  "employment",
  "legal",
  "family_supports",
  "behavioural_incident_follow_up",
  "discharge_planning",
  "system_navigation",
];

const aiActions = [
  ["smis", "Generate SMIS-style note"],
  ["professional", "Make more professional"],
  ["shorter", "Make shorter"],
  ["objective", "Make objective"],
  ["nonjudgmental", "Remove judgmental language"],
  ["supervisor", "Convert to supervisor summary"],
  ["followup", "Convert to follow-up plan"],
] as const;

export default function ClientNoteCreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [aiActionUsed, setAiActionUsed] = useState<string | undefined>(undefined);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactDate: new Date().toISOString().slice(0, 10),
      contactType: "in_person",
      location: "",
      category: "general_check_in",
      roughSummary: "",
      actionsTaken: "",
      referralsMade: "",
      followUpRequired: false,
      riskSafetyConcerns: "",
      finalNote: "",
      createFollowUpTask: false,
      createReferral: false,
      createRiskFlag: false,
    },
  });

  const actor = user
    ? { id: user.id, organizationId: user.organizationId, role: user.role, siteIds: user.siteIds }
    : null;

  const handleAiAction = async (action: string) => {
    const roughSummary = form.getValues("roughSummary");
    if (!roughSummary) {
      toast.error("Enter rough summary first.");
      return;
    }

    setIsGenerating(true);
    const response = await generateCaseNote(roughSummary, action);
    setIsGenerating(false);

    if (!response.success || !response.data) {
      toast.error(response.error || "AI generation failed.");
      return;
    }

    form.setValue("finalNote", response.data, { shouldValidate: true });
    setAiUsed(true);
    setAiActionUsed(action);
    toast.success("AI draft ready. Review before saving.");
  };

  const onSubmit = async (values: FormData) => {
    if (!user || !actor) return;

    setIsSaving(true);
    try {
      const client = await clientsService.getClientById(id, actor);
      if (!client) {
        toast.error("Client not found.");
        return;
      }

      await caseNotesService.createCaseNote(
        {
          organizationId: user.organizationId,
          siteId: client.siteId,
          clientId: client.id,
          authorId: user.id,
          contactDate: values.contactDate,
          contactType: values.contactType as ContactType,
          category: values.category as NoteCategory,
          location: values.location,
          roughSummary: values.roughSummary,
          actionsTaken: values.actionsTaken,
          referralsMade: values.referralsMade,
          followUpRequired: values.followUpRequired,
          riskSafetyConcerns: values.riskSafetyConcerns,
          finalNote: values.finalNote,
          aiGenerated: aiUsed,
          aiActionUsed,
          supervisorReviewed: false,
        },
        actor
      );

      const taskDueDate = (() => {
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date.toISOString();
      })();

      const referralFollowUpDate = (() => {
        const date = new Date();
        date.setDate(date.getDate() + 5);
        return date.toISOString();
      })();

      if (values.createFollowUpTask) {
        await tasksService.createTask(
          {
            organizationId: user.organizationId,
            siteId: client.siteId,
            clientId: client.id,
            assignedToId: user.id,
            createdById: user.id,
            title: `Follow-up with ${client.displayName}`,
            description: values.actionsTaken || "Follow-up from case note.",
            dueDate: taskDueDate,
            priority: client.priority,
            status: "open",
          },
          actor
        );
      }

      if (values.createReferral) {
        await referralsService.createReferral(
          {
            organizationId: user.organizationId,
            siteId: client.siteId,
            clientId: client.id,
            createdById: user.id,
            referralType: "general_support",
            agencyName: "To be assigned",
            referralDate: new Date().toISOString(),
            status: "pending",
            contactPerson: "",
            contactInfo: "",
            followUpDate: values.followUpRequired ? referralFollowUpDate : undefined,
            outcome: "",
          },
          actor
        );
      }

      if (values.createRiskFlag && values.riskSafetyConcerns) {
        await riskFlagsService.createRiskFlag(
          {
            organizationId: user.organizationId,
            siteId: client.siteId,
            clientId: client.id,
            createdById: user.id,
            category: "safety_concern",
            severity: client.priority,
            description: values.riskSafetyConcerns,
            active: true,
            supervisorReviewRequired: true,
          },
          actor
        );
      }

      toast.success("Case note saved.");
      router.push(`/clients/${id}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save case note.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "admin"]}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI-assisted case note</h1>
          <p className="text-muted-foreground">Capture a structured interaction note, run AI drafting, and save to the client timeline.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Interaction details</CardTitle>
              <CardDescription>AI output is always draft-only. Review and edit before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contactDate">Contact date</Label>
                  <Input id="contactDate" type="date" {...form.register("contactDate")} />
                </div>
                <div>
                  <Label>Contact type</Label>
                  <Select value={form.getValues("contactType") ?? "in_person"} onValueChange={(value) => form.setValue("contactType", value as ContactType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{contactTypes.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Shelter office / Outreach / Phone" {...form.register("location")} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.getValues("category") ?? "general_check_in"} onValueChange={(value) => form.setValue("category", value as NoteCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="roughSummary">Rough summary</Label>
                <Textarea id="roughSummary" rows={5} {...form.register("roughSummary")} />
              </div>

              <div className="rounded-md border bg-indigo-50/50 p-4">
                <p className="mb-3 text-sm font-medium text-indigo-900 flex items-center"><Sparkles className="mr-2 h-4 w-4" />AI actions</p>
                <div className="flex flex-wrap gap-2">
                  {aiActions.map(([value, label]) => (
                    <Button key={value} type="button" variant="outline" size="sm" disabled={isGenerating} onClick={() => handleAiAction(value)}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="actionsTaken">Actions taken</Label>
                <Textarea id="actionsTaken" rows={3} {...form.register("actionsTaken")} />
              </div>

              <div>
                <Label htmlFor="riskSafetyConcerns">Risk / safety concerns</Label>
                <Textarea id="riskSafetyConcerns" rows={3} {...form.register("riskSafetyConcerns")} />
              </div>

              <div>
                <Label htmlFor="finalNote">Final note</Label>
                <Textarea id="finalNote" rows={9} {...form.register("finalNote")} />
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <label className="flex items-center justify-between text-sm"><span>Create follow-up task</span><input type="checkbox" checked={form.getValues("createFollowUpTask")} onChange={(event) => form.setValue("createFollowUpTask", event.target.checked)} /></label>
                <label className="flex items-center justify-between text-sm"><span>Create referral draft</span><input type="checkbox" checked={form.getValues("createReferral")} onChange={(event) => form.setValue("createReferral", event.target.checked)} /></label>
                <label className="flex items-center justify-between text-sm"><span>Create risk flag</span><input type="checkbox" checked={form.getValues("createRiskFlag")} onChange={(event) => form.setValue("createRiskFlag", event.target.checked)} /></label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/clients/${id}`} className="text-sm text-muted-foreground hover:underline">Cancel</Link>
              <Button type="submit" disabled={isSaving || isGenerating}>{isSaving ? "Saving…" : "Save note"}</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AuthGuard>
  );
}
