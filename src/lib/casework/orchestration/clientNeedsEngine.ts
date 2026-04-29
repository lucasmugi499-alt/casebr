import {
  ClientNeed,
  ClientNeedType,
  Client,
  ServiceActor,
  GeneratedDocumentType,
  WorkstreamType,
} from "@/types";

/**
 * Filter active (non-completed, non-closed) needs from a client's need list.
 */
export const deriveActiveClientNeeds = (clientNeeds: ClientNeed[]): ClientNeed[] =>
  clientNeeds.filter((n) => !["completed", "closed"].includes(n.status));

// ── Mapping tables ──────────────────────────────────────────────────────────

interface NeedMapping {
  needType: ClientNeedType;
  recommendedNextAction: string;
  relatedDocumentTypes: GeneratedDocumentType[];
  relatedWorkstreamType?: WorkstreamType;
}

const INTAKE_NEED_MAP: Record<string, NeedMapping> = {
  housing_support: {
    needType: "housing_support",
    recommendedNextAction: "Start Housing Plan",
    relatedDocumentTypes: ["housing_plan"],
    relatedWorkstreamType: "housing",
  },
  income_support: {
    needType: "income_benefits_support",
    recommendedNextAction: "Confirm income/benefits status",
    relatedDocumentTypes: ["service_plan"],
    relatedWorkstreamType: "income_benefits",
  },
  health_wellness: {
    needType: "health_medical_support",
    recommendedNextAction: "Schedule health intake and connect to services",
    relatedDocumentTypes: ["service_plan"],
    relatedWorkstreamType: "health_medical",
  },
  safety_planning: {
    needType: "safety_planning",
    recommendedNextAction: "Complete Safety Plan",
    relatedDocumentTypes: ["safety_plan"],
    relatedWorkstreamType: "safety",
  },
  legal_support: {
    needType: "legal_support",
    recommendedNextAction: "Connect to legal clinic or duty counsel",
    relatedDocumentTypes: ["service_plan"],
    relatedWorkstreamType: "legal",
  },
  employment_education: {
    needType: "employment_support",
    recommendedNextAction: "Refer to employment readiness program",
    relatedDocumentTypes: ["service_plan"],
    relatedWorkstreamType: "employment",
  },
};

/**
 * Derive ClientNeed objects from intake assessment answers.
 * Does NOT persist — returns objects for the caller to persist.
 */
export function deriveNeedsFromIntakeAnswers(
  priorityNeeds: string[],
  actor: ServiceActor,
  client: Client,
  existingNeeds: ClientNeed[]
): ClientNeed[] {
  const now = new Date().toISOString();
  const existingTypes = new Set(existingNeeds.map((n) => n.needType));
  const newNeeds: ClientNeed[] = [];

  for (const key of priorityNeeds) {
    const mapping = INTAKE_NEED_MAP[key];
    if (!mapping) continue;
    // Don't duplicate an existing need
    if (existingTypes.has(mapping.needType)) continue;

    newNeeds.push({
      id: `need_${client.id}_${mapping.needType}_${Date.now()}`,
      clientId: client.id,
      needType: mapping.needType,
      status: "identified",
      priority: "high",
      sourceOfNeed: "Initial Assessment",
      dateIdentified: now,
      identifiedBy: actor.id,
      recommendedNextAction: mapping.recommendedNextAction,
      relatedDocumentTypes: mapping.relatedDocumentTypes,
      relatedTaskIds: [],
      relatedReferralIds: [],
    });
  }

  // Always add service_planning if not already present
  if (!existingTypes.has("service_planning")) {
    newNeeds.push({
      id: `need_${client.id}_service_planning_${Date.now()}`,
      clientId: client.id,
      needType: "service_planning",
      status: "identified",
      priority: "medium",
      sourceOfNeed: "Initial Assessment",
      dateIdentified: now,
      identifiedBy: actor.id,
      recommendedNextAction: "Complete Service Plan",
      relatedDocumentTypes: ["service_plan"],
      relatedTaskIds: [],
      relatedReferralIds: [],
    });
  }

  return newNeeds;
}

/**
 * Get the workstream type associated with a need type (if any).
 */
export function getWorkstreamTypeForNeed(needType: ClientNeedType): WorkstreamType | undefined {
  const entry = Object.values(INTAKE_NEED_MAP).find((m) => m.needType === needType);
  return entry?.relatedWorkstreamType;
}
