import {
  CaseworkerNudge,
  Client,
  ClientCaseworkState,
  ManagerNudge,
  Priority,
  RequiredPlan,
  SmartTaskRecommendation,
  SSANudge,
  Task,
} from "@/types";

// ── Caseworker Nudges ───────────────────────────────────────────────────────

export interface CaseworkerNudgeInput {
  client: Client;
  requiredPlans: RequiredPlan[];
  smartTasks: SmartTaskRecommendation[];
}

/**
 * Generate nudges that a caseworker should see for a specific client.
 */
export function generateCaseworkerNudges(input: CaseworkerNudgeInput): CaseworkerNudge[] {
  const { client, smartTasks, requiredPlans } = input;
  const nudges: CaseworkerNudge[] = [];
  let counter = 0;

  // From missing/review_due plans
  for (const plan of requiredPlans) {
    if (plan.status === "missing" || plan.status === "review_due") {
      counter++;
      nudges.push({
        id: `nudge-${client.id}-${counter}`,
        clientId: client.id,
        clientName: client.displayName,
        message: `${plan.actionLabel} for ${client.displayName}.`,
        priority: plan.priority,
        actionLabel: plan.actionLabel,
        actionUrl: plan.actionUrl,
        source: "missing_plan",
      });
    }
  }

  // From smart tasks (top 3 that aren't already covered by plans)
  const planTitles = new Set(nudges.map((n) => n.message));
  for (const task of smartTasks.slice(0, 5)) {
    const msg = `${task.title} for ${client.displayName}.`;
    if (planTitles.has(msg)) continue;
    counter++;
    nudges.push({
      id: `nudge-${client.id}-${counter}`,
      clientId: client.id,
      clientName: client.displayName,
      message: msg,
      priority: task.priority,
      actionLabel: task.title,
      actionUrl: `/clients/${client.id}`,
      source: "smart_task",
    });
    if (nudges.length >= 6) break;
  }

  return nudges.slice(0, 6);
}

// ── SSA Nudges ──────────────────────────────────────────────────────────────

export interface SSANudgeInput {
  clientStates: ClientCaseworkState[];
  unassignedClients: Client[];
  allTasks: Task[];
}

/**
 * Generate SSA-level nudges from aggregated team state.
 */
export function generateSSANudges(input: SSANudgeInput): SSANudge[] {
  const { clientStates, unassignedClients, allTasks } = input;
  const nudges: SSANudge[] = [];
  const now = Date.now();

  // 1. Unassigned clients
  if (unassignedClients.length > 0) {
    nudges.push({
      type: "unassigned_clients",
      message: `${unassignedClients.length} unassigned client(s) require SSA assignment.`,
      priority: "high",
      count: unassignedClients.length,
      actionLabel: "View Assignments",
      actionUrl: "/team",
      relatedClientIds: unassignedClients.map((c) => c.id),
    });
  }

  // 2. Clients missing required plans
  const clientsWithMissingPlans = clientStates.filter(
    (s) => s.missingPlans.length > 0
  );
  if (clientsWithMissingPlans.length > 0) {
    nudges.push({
      type: "missing_plans",
      message: `${clientsWithMissingPlans.length} client(s) are missing required plans.`,
      priority: "high",
      count: clientsWithMissingPlans.length,
      relatedClientIds: clientsWithMissingPlans.map((s) => s.client.id),
    });
  }

  // 3. Workers with overdue tasks
  const overdueTasks = allTasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      new Date(t.dueDate).getTime() < now
  );
  if (overdueTasks.length > 0) {
    const workerIds = [...new Set(overdueTasks.map((t) => t.assignedToId))];
    nudges.push({
      type: "overdue_tasks",
      message: `${overdueTasks.length} overdue task(s) across ${workerIds.length} worker(s).`,
      priority: "medium",
      count: overdueTasks.length,
      relatedWorkerIds: workerIds,
    });
  }

  // 4. Safety reviews due
  const safetyReviewsDue = clientStates.filter((s) =>
    s.requiredPlans.some((p) => p.type === "safety_plan" && p.status === "review_due")
  );
  if (safetyReviewsDue.length > 0) {
    nudges.push({
      type: "safety_review_due",
      message: `${safetyReviewsDue.length} client(s) have safety plan reviews due.`,
      priority: "high",
      count: safetyReviewsDue.length,
      relatedClientIds: safetyReviewsDue.map((s) => s.client.id),
    });
  }

  // 5. Documentation gaps
  const lowDocClients = clientStates.filter(
    (s) => s.documentationStatus.overallCompletionPercent < 50
  );
  if (lowDocClients.length > 0) {
    nudges.push({
      type: "documentation_gaps",
      message: `${lowDocClients.length} client(s) have documentation completion below 50%.`,
      priority: "medium",
      count: lowDocClients.length,
      relatedClientIds: lowDocClients.map((s) => s.client.id),
    });
  }

  return nudges;
}

// ── Manager Nudges ──────────────────────────────────────────────────────────

export interface ManagerNudgeInput {
  clientStates: ClientCaseworkState[];
  sites: { id: string; name: string }[];
}

/**
 * Generate manager-level nudges from aggregated program state.
 */
export function generateManagerNudges(input: ManagerNudgeInput): ManagerNudge[] {
  const { clientStates, sites } = input;
  const nudges: ManagerNudge[] = [];

  // 1. Documentation gaps by site
  for (const site of sites) {
    const siteClients = clientStates.filter((s) => s.client.siteId === site.id);
    const gapClients = siteClients.filter(
      (s) => s.documentationStatus.overallCompletionPercent < 50
    );
    if (gapClients.length >= 2) {
      nudges.push({
        type: "documentation_gap",
        message: `Review ${site.name} — ${gapClients.length} clients with documentation gaps.`,
        priority: "medium",
        count: gapClients.length,
        siteId: site.id,
        siteName: site.name,
      });
    }
  }

  // 2. Low housing plan completion
  const needsHousingPlan = clientStates.filter((s) =>
    s.requiredPlans.some((p) => p.type === "housing_plan")
  );
  const missingHousingPlan = needsHousingPlan.filter((s) =>
    s.requiredPlans.some((p) => p.type === "housing_plan" && p.status === "missing")
  );
  if (missingHousingPlan.length >= 2) {
    nudges.push({
      type: "low_plan_completion",
      message: `Housing plan completion is low — ${missingHousingPlan.length} client(s) still need Housing Plans.`,
      priority: "medium",
      count: missingHousingPlan.length,
    });
  }

  // 3. High pending referrals (> 7 days)
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  let staleReferralCount = 0;
  for (const state of clientStates) {
    staleReferralCount += state.referrals.filter(
      (r) =>
        ["pending", "no_response"].includes(r.status) &&
        new Date(r.referralDate).getTime() < now - sevenDays
    ).length;
  }
  if (staleReferralCount >= 3) {
    nudges.push({
      type: "high_pending_referrals",
      message: `${staleReferralCount} referrals have been pending for more than 7 days.`,
      priority: "medium",
      count: staleReferralCount,
    });
  }

  // 4. Safety reviews due
  const safetyDue = clientStates.filter((s) =>
    s.requiredPlans.some((p) => p.type === "safety_plan" && p.status === "review_due")
  );
  if (safetyDue.length > 0) {
    nudges.push({
      type: "safety_reviews_due",
      message: `${safetyDue.length} safety plan review(s) are overdue.`,
      priority: "high",
      count: safetyDue.length,
    });
  }

  return nudges;
}
