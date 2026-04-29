import {
  Client,
  ClientNeed,
  ClientNeedType,
  GeneratedDocument,
  GeneratedDocumentType,
  RequiredPlan,
  RequiredPlanStatus,
  Priority,
} from "@/types";

// ── Plan metadata ───────────────────────────────────────────────────────────

const PLAN_META: Record<
  GeneratedDocumentType,
  { label: string; actionStart: string; path: string } | null
> = {
  intake_assessment: { label: "Intake Assessment", actionStart: "Start Intake Assessment", path: "intake" },
  document_checklist: { label: "Document Checklist", actionStart: "Start Document Checklist", path: "checklist" },
  housing_plan: { label: "Housing Plan", actionStart: "Start Housing Plan", path: "housing" },
  safety_plan: { label: "Safety Plan", actionStart: "Start Safety Plan", path: "safety" },
  service_plan: { label: "Service Plan", actionStart: "Start Service Plan", path: "service" },
  discharge_transition_plan: { label: "Discharge / Transition Plan", actionStart: "Start Discharge Plan", path: "discharge" },
  // types that are not standalone required plans
  supervisor_summary: null,
  case_summary: null,
};

// ── Need-type → plan-type mapping ───────────────────────────────────────────

const NEED_TO_PLAN: Partial<Record<ClientNeedType, GeneratedDocumentType>> = {
  housing_support: "housing_plan",
  safety_planning: "safety_plan",
  discharge_transition_planning: "discharge_transition_plan",
};

// ── Main function ───────────────────────────────────────────────────────────

export interface PlanRecommendationInput {
  client: Client;
  clientNeeds: ClientNeed[];
  generatedDocuments: GeneratedDocument[];
}

/**
 * Determines which plans are required for this client, and their current status.
 */
export function getRequiredPlansForClient(input: PlanRecommendationInput): RequiredPlan[] {
  const { client, clientNeeds, generatedDocuments } = input;
  const needTypes = new Set<ClientNeedType>(clientNeeds.map((n) => n.needType));
  const now = Date.now();

  // 1. Determine which plan types are required
  const requiredTypes = new Set<GeneratedDocumentType>([
    "intake_assessment",
    "document_checklist",
    "service_plan",
  ]);

  if (needTypes.has("housing_support")) requiredTypes.add("housing_plan");
  if (needTypes.has("safety_planning")) requiredTypes.add("safety_plan");

  // Missing documents → require document_checklist
  if (needTypes.has("identification_documents_support")) requiredTypes.add("document_checklist");

  // Discharge / transition
  if (
    ["housed", "discharged", "transferred", "follow_up_support"].includes(client.status) ||
    needTypes.has("discharge_transition_planning")
  ) {
    requiredTypes.add("discharge_transition_plan");
  }

  // 2. Build plan status for each required type
  const plans: RequiredPlan[] = [];

  for (const type of requiredTypes) {
    const meta = PLAN_META[type];
    if (!meta) continue;

    // Find latest matching document
    const docs = generatedDocuments
      .filter((d) => d.type === type)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const doc = docs[0];

    // Determine status
    let status: RequiredPlanStatus = "missing";
    if (doc) {
      if (doc.status === "completed" || doc.status === "copied_to_smis") {
        status = "completed";
      } else if (doc.status === "draft") {
        status = "draft";
      } else if (
        doc.status === "review_due" ||
        (doc.reviewDate && new Date(doc.reviewDate).getTime() < now)
      ) {
        status = "review_due";
      } else {
        status = "completed"; // archived or other
      }
    }

    // Determine reason
    const relatedNeed = Object.entries(NEED_TO_PLAN).find(([, planType]) => planType === type);
    const relatedNeedType = relatedNeed ? (relatedNeed[0] as ClientNeedType) : undefined;
    const reasonRequired =
      relatedNeedType && needTypes.has(relatedNeedType)
        ? `${meta.label} is required because ${relatedNeedType.replace(/_/g, " ")} was identified.`
        : `${meta.label} is required for all clients in the casework process.`;

    // Priority
    const priority: Priority = ["housing_plan", "safety_plan"].includes(type) ? "high" : "medium";

    // Action
    const actionLabel =
      status === "completed"
        ? "Review Plan"
        : status === "draft"
          ? `Continue ${meta.label}`
          : status === "review_due"
            ? `Review ${meta.label}`
            : meta.actionStart;

    const actionUrl = `/clients/${client.id}/plans/${meta.path}/new`;

    plans.push({
      type,
      label: meta.label,
      status,
      reasonRequired,
      relatedNeedType,
      priority,
      actionLabel,
      actionUrl,
      relatedDocumentId: doc?.id,
    });
  }

  // Sort: missing/review_due first, then by priority
  const statusOrder: Record<RequiredPlanStatus, number> = {
    missing: 0,
    review_due: 1,
    draft: 2,
    completed: 3,
    not_applicable: 4,
  };
  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

  plans.sort((a, b) => {
    const s = statusOrder[a.status] - statusOrder[b.status];
    if (s !== 0) return s;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return plans;
}
