import {
  AuditLog,
  CaseNote,
  Client,
  ClientCaseworkState,
  ClientNeed,
  DocumentChecklist,
  DocumentationChecklist,
  GeneratedDocument,
  AppliedAssessmentResult,
  Referral,
  RequiredPlan,
  RiskFlag,
  SafetyPlan,
  ServiceActor,
  SupervisorReview,
  Task,
  TimelineItem,
  Workstream,
} from "@/types";
import { deriveActiveClientNeeds, deriveNeedsFromIntakeAnswers } from "./clientNeedsEngine";
import { deriveWorkstreamsFromNeeds } from "./workstreamEngine";
import { getRequiredPlansForClient } from "./planRecommendationEngine";
import { calculateHousingReadiness } from "./housingReadinessEngine";
import { calculateDocumentationStatus } from "./documentationStatusEngine";
import { generateSmartTaskRecommendations } from "./smartTaskEngine";
import { generateCaseworkerNudges } from "./nudgeEngine";

// ── Input type ──────────────────────────────────────────────────────────────

export interface ClientCaseworkStateInput {
  client: Client;
  notes: CaseNote[];
  tasks: Task[];
  referrals: Referral[];
  riskFlags: RiskFlag[];
  safetyPlans: SafetyPlan[];
  generatedDocuments: GeneratedDocument[];
  clientNeeds: ClientNeed[];
  workstreams: Workstream[];
  documentationChecklist: DocumentationChecklist | null;
  documentChecklist: DocumentChecklist | null;
  supervisorReviews: SupervisorReview[];
  timeline?: TimelineItem[];
}

// ── Main orchestrator ───────────────────────────────────────────────────────

/**
 * Build the complete casework state for a single client.
 * This is the single source of truth for the Client Work File,
 * caseworker dashboard, SSA board, and manager dashboard.
 */
export function buildClientCaseworkState(
  input: ClientCaseworkStateInput
): ClientCaseworkState {
  const {
    client,
    notes,
    tasks,
    referrals,
    riskFlags,
    safetyPlans,
    generatedDocuments,
    clientNeeds,
    workstreams,
    documentationChecklist,
    documentChecklist,
    supervisorReviews,
    timeline,
  } = input;

  // 1. Derive required plans
  const requiredPlans: RequiredPlan[] = getRequiredPlansForClient({
    client,
    clientNeeds,
    generatedDocuments,
  });

  // 2. Documentation status
  const documentationStatus = calculateDocumentationStatus({
    client,
    clientNeeds,
    requiredPlans,
    generatedDocuments,
    referrals,
    riskFlags,
    notes,
  });

  // 3. Housing readiness
  const housingReadiness = calculateHousingReadiness({
    client,
    clientNeeds,
    requiredPlans,
    documentationChecklist,
    documentChecklist,
    tasks,
    referrals,
    generatedDocuments,
    notes,
  });

  // 4. Smart tasks
  const smartTasks = generateSmartTaskRecommendations({
    client,
    requiredPlans,
    housingReadiness,
    tasks,
    referrals,
    safetyPlans,
    generatedDocuments,
  });

  // 5. Derived collections
  const activeNeeds = deriveActiveClientNeeds(clientNeeds);
  const missingPlans = requiredPlans.filter(
    (p) => p.status === "missing" || p.status === "draft" || p.status === "review_due"
  );
  const completedPlans = requiredPlans.filter((p) => p.status === "completed");

  // 6. Next best actions (top 5 from smart tasks)
  const nextBestActions = smartTasks.slice(0, 5).map((t) => t.title);

  // 7. Caseworker nudges
  const ssaNudges = generateCaseworkerNudges({
    client,
    requiredPlans,
    smartTasks,
  });

  // 8. Manager flags (for aggregation)
  const managerFlags = [
    {
      type: "documentation_gaps",
      count: documentationStatus.items.filter(
        (i) => i.required && i.status !== "completed"
      ).length,
    },
  ];

  // 9. Priority level
  const priorityLevel =
    client.priority === "high" ||
    missingPlans.some((p) => p.priority === "high") ||
    riskFlags.some((r) => r.active && r.severity === "high")
      ? "high"
      : tasks.some(
            (t) =>
              t.status !== "completed" &&
              t.status !== "cancelled" &&
              new Date(t.dueDate).getTime() < Date.now()
          )
        ? "medium"
        : "low";

  // 10. Summary
  const summary = `${client.displayName}: ${housingReadiness.level.replace(/_/g, " ")} with ${missingPlans.length} required plan(s) needing attention.`;

  return {
    client,
    notes,
    tasks,
    referrals,
    riskFlags,
    safetyPlans,
    generatedDocuments,
    clientNeeds,
    activeNeeds,
    workstreams,
    documentationChecklist,
    documentChecklist,
    supervisorReviews,
    requiredPlans,
    completedPlans,
    missingPlans,
    documentationStatus,
    housingReadiness,
    smartTasks,
    nextBestActions,
    ssaNudges,
    managerFlags,
    timelineHighlights: timeline ?? [],
    priorityLevel,
    summary,
  };
}

// ── Initial Assessment Application ──────────────────────────────────────────

export interface ApplyAssessmentInput {
  client: Client;
  intakeAnswers: { priorityNeeds?: string[]; [key: string]: unknown };
  actor: ServiceActor;
  existingNeeds: ClientNeed[];
  existingWorkstreams: Workstream[];
}

/**
 * Apply Initial Assessment answers to the client file.
 * Creates needs, workstreams, recommends plans, and generates audit/timeline items.
 * Returns all objects for the caller to persist.
 */
export function applyInitialAssessmentToClientFile(
  input: ApplyAssessmentInput
): AppliedAssessmentResult {
  const { client, intakeAnswers, actor, existingNeeds, existingWorkstreams } = input;
  const now = new Date().toISOString();
  const priorityNeeds = intakeAnswers.priorityNeeds ?? [];

  // 1. Create needs from intake answers
  const createdNeeds = deriveNeedsFromIntakeAnswers(
    priorityNeeds,
    actor,
    client,
    existingNeeds
  );

  // 2. Create workstreams from needs
  const allNeeds = [...existingNeeds, ...createdNeeds];
  const createdWorkstreams = deriveWorkstreamsFromNeeds(
    allNeeds,
    client.id,
    actor.id,
    existingWorkstreams
  );

  // 3. Determine recommended plans
  // Build a temporary GeneratedDocument[] with no documents to see what's required
  const recommendedPlans = getRequiredPlansForClient({
    client,
    clientNeeds: allNeeds,
    generatedDocuments: [], // none exist yet for a fresh intake
  });

  // 4. Smart task recommendations (lightweight — just from plans)
  const smartTaskRecommendations = recommendedPlans
    .filter((p) => p.status === "missing")
    .map((p, i) => ({
      id: `rec-intake-${client.id}-${i}`,
      clientId: client.id,
      title: `Complete ${p.label}`,
      reason: `${p.label} is required based on Initial Assessment.`,
      priority: p.priority,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      relatedDocumentType: p.type,
      source: "initial_assessment",
      canDismiss: true,
      canAccept: true,
    }));

  // 5. Timeline item
  const timelineItem: TimelineItem = {
    id: `timeline-intake-${Date.now()}`,
    clientId: client.id,
    type: "intake_assessment",
    date: now,
    title: "Initial Assessment completed",
    summary: `Assessment identified ${createdNeeds.length} need(s) and recommended ${recommendedPlans.filter((p) => p.status === "missing").length} plan(s).`,
    staffId: actor.id,
    staffName: `${actor.firstName} ${actor.lastName}`,
    entityId: client.id,
    entityType: "client",
  };

  // 6. Audit log
  const auditLog: AuditLog = {
    id: `audit-intake-${Date.now()}`,
    organizationId: client.organizationId,
    siteId: client.siteId,
    userId: actor.id,
    action: "initial_assessment_applied",
    entityType: "client",
    entityId: client.id,
    timestamp: now,
    metadata: {
      needsCreated: createdNeeds.map((n) => n.needType),
      workstreamsCreated: createdWorkstreams.map((w) => w.type),
      recommendedPlans: recommendedPlans.map((p) => p.type),
    },
  };

  return {
    createdNeeds,
    createdWorkstreams,
    recommendedPlans,
    smartTaskRecommendations,
    timelineItem,
    auditLog,
  };
}
