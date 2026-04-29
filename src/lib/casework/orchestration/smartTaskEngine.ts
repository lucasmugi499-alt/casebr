import {
  Client,
  GeneratedDocument,
  HousingReadiness,
  Priority,
  Referral,
  RequiredPlan,
  SafetyPlan,
  SmartTaskRecommendation,
  Task,
} from "@/types";

export interface SmartTaskInput {
  client: Client;
  requiredPlans: RequiredPlan[];
  housingReadiness: HousingReadiness;
  tasks: Task[];
  referrals: Referral[];
  safetyPlans: SafetyPlan[];
  generatedDocuments: GeneratedDocument[];
}

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate smart task recommendations based on the client's casework state.
 * These are suggestions — NOT auto-created tasks.
 */
export function generateSmartTaskRecommendations(input: SmartTaskInput): SmartTaskRecommendation[] {
  const { client, requiredPlans, tasks, referrals, safetyPlans } = input;
  const out: SmartTaskRecommendation[] = [];
  const now = Date.now();
  let counter = 0;

  const add = (
    title: string,
    reason: string,
    priority: Priority = "medium",
    extra: Partial<SmartTaskRecommendation> = {}
  ) => {
    counter++;
    out.push({
      id: `rec-${client.id}-${counter}`,
      clientId: client.id,
      title,
      reason,
      priority,
      dueDate: new Date(now + THREE_DAYS).toISOString(),
      source: "casework_orchestration",
      canDismiss: true,
      canAccept: true,
      ...extra,
    });
  };

  // 1. Missing or incomplete plans
  for (const plan of requiredPlans) {
    if (plan.status === "missing") {
      add(
        `Complete ${plan.label}`,
        `${plan.label} is required but has not been started.`,
        plan.priority,
        { relatedDocumentType: plan.type }
      );
    } else if (plan.status === "review_due") {
      add(
        `Review ${plan.label}`,
        `${plan.label} review date has passed.`,
        plan.priority,
        { relatedDocumentType: plan.type }
      );
    } else if (plan.status === "draft") {
      add(
        `Complete ${plan.label}`,
        `${plan.label} is in draft and needs to be finalized.`,
        plan.priority,
        { relatedDocumentType: plan.type }
      );
    }
  }

  // 2. Stale contact
  if (
    !client.lastContactAt ||
    new Date(client.lastContactAt).getTime() < now - SEVEN_DAYS
  ) {
    add(
      "Add case note",
      "No contact documented in the last 7 days.",
      "high"
    );
  }

  // 3. Pending referrals > 7 days
  const staleReferrals = referrals.filter(
    (r) =>
      r.clientId === client.id &&
      ["pending", "no_response"].includes(r.status) &&
      new Date(r.referralDate).getTime() < now - SEVEN_DAYS
  );
  for (const ref of staleReferrals) {
    add(
      `Follow up on ${ref.referralType} referral`,
      `Referral to ${ref.agencyName} has been pending for more than 7 days.`,
      "medium",
      { relatedWorkstreamType: ref.referralType === "housing" ? "housing" : undefined }
    );
  }

  // 4. Safety plan review due
  for (const sp of safetyPlans) {
    if (
      sp.clientId === client.id &&
      sp.status !== "closed" &&
      sp.reviewDate &&
      new Date(sp.reviewDate).getTime() < now
    ) {
      add(
        "Review Safety Plan",
        "Safety Plan review date has passed.",
        "high",
        { relatedDocumentType: "safety_plan" }
      );
      break; // one nudge is enough
    }
  }

  // 5. Overdue tasks (surface as recommendations)
  const overdueTasks = tasks.filter(
    (t) =>
      t.clientId === client.id &&
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      new Date(t.dueDate).getTime() < now
  );
  for (const task of overdueTasks.slice(0, 2)) {
    add(
      `Complete overdue task: ${task.title}`,
      `Task was due on ${new Date(task.dueDate).toLocaleDateString()}.`,
      "high"
    );
  }

  // Sort: high priority first
  const pOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  out.sort((a, b) => pOrder[a.priority] - pOrder[b.priority]);

  return out;
}
