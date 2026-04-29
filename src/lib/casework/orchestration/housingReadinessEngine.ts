import {
  Client,
  ClientNeed,
  DocumentChecklist,
  DocumentationChecklist,
  GeneratedDocument,
  HousingReadiness,
  HousingReadinessLevel,
  Referral,
  RequiredPlan,
  Task,
} from "@/types";

export interface HousingReadinessInput {
  client: Client;
  clientNeeds: ClientNeed[];
  requiredPlans: RequiredPlan[];
  documentationChecklist: DocumentationChecklist | null;
  documentChecklist: DocumentChecklist | null;
  tasks: Task[];
  referrals: Referral[];
  generatedDocuments: GeneratedDocument[];
  notes: { id: string }[];
}

type Check = [label: string, passed: boolean];

/**
 * Calculate a housing readiness score based on documentation, plans, and service connections.
 * This is a casework-readiness checklist, NOT a clinical or eligibility decision.
 */
export function calculateHousingReadiness(input: HousingReadinessInput): HousingReadiness {
  const {
    client,
    clientNeeds,
    requiredPlans,
    documentationChecklist,
    documentChecklist,
    tasks,
    referrals,
    generatedDocuments,
  } = input;

  const planStatus = (type: string) =>
    requiredPlans.find((p) => p.type === type)?.status ?? "missing";

  const hasSafetyNeed = clientNeeds.some((n) => n.needType === "safety_planning");
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const housingTasks = tasks.filter(
    (t) => t.clientId === client.id && t.status !== "completed"
  );
  const overdueHousingTasks = housingTasks.filter(
    (t) => new Date(t.dueDate).getTime() < now
  );
  const housingReferrals = referrals.filter(
    (r) => r.clientId === client.id && r.referralType === "housing"
  );
  const pendingReferrals = housingReferrals.filter(
    (r) => ["pending", "no_response"].includes(r.status)
  );

  const checks: Check[] = [
    // Plan completion checks
    ["Intake Assessment completed", planStatus("intake_assessment") === "completed"],
    ["Housing Plan completed", planStatus("housing_plan") === "completed"],
    ["Service Plan completed", planStatus("service_plan") === "completed"],
    ["Document Checklist completed", planStatus("document_checklist") === "completed"],

    // Document readiness
    ["Government ID documented", documentChecklist?.governmentId === "complete"],
    [
      "Income status documented",
      documentationChecklist?.incomeStatusDocumented ?? false,
    ],
    [
      "Proof of income available or requested",
      documentChecklist?.proofOfIncome === "complete" ||
        documentChecklist?.proofOfIncome === "requested",
    ],
    [
      "Housing documents available or requested",
      documentChecklist?.housingDocuments === "complete" ||
        documentChecklist?.housingDocuments === "requested",
    ],

    // Service connections
    [
      "Housing referral or application exists",
      housingReferrals.length > 0 ||
        generatedDocuments.some(
          (d) => d.type === "housing_plan" && d.status === "completed"
        ),
    ],
    ["No overdue housing tasks", overdueHousingTasks.length === 0],
    [
      "Pending referrals followed up",
      pendingReferrals.length === 0 ||
        pendingReferrals.every(
          (r) =>
            r.followUpDate && new Date(r.followUpDate).getTime() > now
        ),
    ],

    // Safety (conditional)
    ...(hasSafetyNeed
      ? ([
          [
            "Safety Plan completed (safety need exists)",
            planStatus("safety_plan") === "completed",
          ],
        ] as Check[])
      : []),

    // Recent contact
    [
      "Recent case note / contact within 7 days",
      !!client.lastContactAt &&
        new Date(client.lastContactAt).getTime() > now - sevenDaysMs,
    ],
  ];

  const completedItems = checks.filter((c) => c[1]).map((c) => c[0]);
  const missingItems = checks.filter((c) => !c[1]).map((c) => c[0]);
  const score = checks.length > 0
    ? Math.round((completedItems.length / checks.length) * 100)
    : 0;

  const level: HousingReadinessLevel =
    score >= 90
      ? "housing_ready"
      : score >= 70
        ? "mostly_ready"
        : score >= 40
          ? "getting_ready"
          : "not_ready";

  return {
    score,
    level,
    completedItems,
    missingItems,
    blockers: missingItems.slice(0, 3),
    recommendedNextActions: missingItems.map((m) => `Complete: ${m}`),
  };
}
