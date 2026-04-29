import {
  Client,
  ClientNeed,
  DocumentationStatus,
  DocumentationStatusItem,
  GeneratedDocument,
  Referral,
  RequiredPlan,
  RiskFlag,
  CaseNote,
} from "@/types";

export interface DocumentationStatusInput {
  client: Client;
  clientNeeds: ClientNeed[];
  requiredPlans: RequiredPlan[];
  generatedDocuments: GeneratedDocument[];
  referrals: Referral[];
  riskFlags: RiskFlag[];
  notes: CaseNote[];
}

/**
 * Calculate a per-client documentation status across all required items.
 */
export function calculateDocumentationStatus(input: DocumentationStatusInput): DocumentationStatus {
  const { client, clientNeeds, requiredPlans, referrals, riskFlags, notes } = input;

  const needTypes = new Set(clientNeeds.map((n) => n.needType));
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Helper: get plan status from requiredPlans
  const planItem = (
    key: string,
    label: string,
    planType: string,
    required: boolean
  ): DocumentationStatusItem => {
    const plan = requiredPlans.find((p) => p.type === planType);
    const status = required
      ? (plan?.status ?? "missing")
      : "not_applicable";
    return {
      key,
      label,
      status: status as DocumentationStatusItem["status"],
      relatedDocumentId: plan?.relatedDocumentId,
      actionLabel: plan?.actionLabel ?? "Open",
      actionUrl: plan?.actionUrl ?? `/clients/${client.id}`,
      required,
    };
  };

  const items: DocumentationStatusItem[] = [
    planItem("intake", "Intake Assessment", "intake_assessment", true),
    planItem("docs", "Document Checklist", "document_checklist", true),
    planItem("housing", "Housing Plan", "housing_plan", needTypes.has("housing_support")),
    planItem("safety", "Safety Plan", "safety_plan", needTypes.has("safety_planning")),
    planItem("service", "Service Plan / Goals", "service_plan", true),

    // Case Note Updated (within 7 days)
    {
      key: "case_note",
      label: "Case Note Updated",
      status:
        notes.length > 0 &&
        new Date(notes[0].contactDate).getTime() > now - sevenDaysMs
          ? "completed"
          : "missing",
      actionLabel: "Add Case Note",
      actionUrl: `/clients/${client.id}/notes/new`,
      required: true,
    },

    // Referrals Documented
    {
      key: "referrals",
      label: "Referrals Documented",
      status: referrals.length > 0 ? "completed" : "missing",
      actionLabel: "Add Referral",
      actionUrl: `/clients/${client.id}?tab=actions`,
      required: true,
    },

    // Risk / Safety Review
    {
      key: "risk_review",
      label: "Risk / Safety Review",
      status: (() => {
        const activeRisks = riskFlags.filter((r) => r.active && r.supervisorReviewRequired);
        if (activeRisks.length === 0) return "not_applicable" as const;
        return "completed" as const; // if risks exist they've been documented
      })(),
      actionLabel: "Review Risks",
      actionUrl: `/clients/${client.id}?tab=actions`,
      required: riskFlags.some((r) => r.active),
    },

    // Discharge / Transition Plan
    planItem(
      "discharge",
      "Discharge / Transition Plan",
      "discharge_transition_plan",
      needTypes.has("discharge_transition_planning") ||
        ["housed", "discharged", "transferred", "follow_up_support"].includes(client.status)
    ),
  ];

  // Calculate overall completion
  const requiredItems = items.filter((i) => i.required);
  const completedRequired = requiredItems.filter((i) => i.status === "completed");
  const overallCompletionPercent =
    requiredItems.length > 0
      ? Math.round((completedRequired.length / requiredItems.length) * 100)
      : 100;

  return { overallCompletionPercent, items };
}

export interface SiteDocumentationGaps {
  siteId: string;
  totalClients: number;
  overallHealthPercent: number;
  missingIntakeCount: number;
  missingHousingPlanCount: number;
  missingServicePlanCount: number;
  staleNoteCount: number;
}

/**
 * Aggregates documentation health across all clients in a site.
 */
export function calculateSiteDocumentationGaps(
  siteId: string,
  clientStates: any[] // Using any to avoid circular dependency with ClientCaseworkState
): SiteDocumentationGaps {
  const siteStates = clientStates.filter((s) => s.client.siteId === siteId);
  const total = siteStates.length;

  if (total === 0) {
    return {
      siteId,
      totalClients: 0,
      overallHealthPercent: 100,
      missingIntakeCount: 0,
      missingHousingPlanCount: 0,
      missingServicePlanCount: 0,
      staleNoteCount: 0,
    };
  }

  const missingIntake = siteStates.filter(
    (s) => s.documentationStatus.items.find((i: any) => i.key === "intake")?.status === "missing"
  ).length;
  const missingHousing = siteStates.filter(
    (s) => s.documentationStatus.items.find((i: any) => i.key === "housing")?.status === "missing"
  ).length;
  const missingService = siteStates.filter(
    (s) => s.documentationStatus.items.find((i: any) => i.key === "service")?.status === "missing"
  ).length;
  const staleNotes = siteStates.filter(
    (s) => s.documentationStatus.items.find((i: any) => i.key === "case_note")?.status === "missing"
  ).length;

  const avgHealth =
    siteStates.reduce((acc, s) => acc + s.documentationStatus.overallCompletionPercent, 0) / total;

  return {
    siteId,
    totalClients: total,
    overallHealthPercent: Math.round(avgHealth),
    missingIntakeCount: missingIntake,
    missingHousingPlanCount: missingHousing,
    missingServicePlanCount: missingService,
    staleNoteCount: staleNotes,
  };
}

