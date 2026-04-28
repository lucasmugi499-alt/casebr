import { AuditLog, CaseNote, Client, Referral, RiskFlag, SafetyPlan, ServiceActor, SupervisorReview, Task } from "@/types";
import { demoUsers } from "./demoData";
import { getBaseAuditLogs, getDemoStore } from "./demoStore";

const canViewClient = (client: Client, actor: ServiceActor) => {
  if (actor.role === "admin" || actor.role === "manager") return true;
  if (actor.role === "ssa") return actor.siteIds.includes(client.siteId);
  return client.assignedWorkerIds.includes(actor.id);
};

const uniqueClients = (clients: Client[]) => {
  const seen = new Set<string>();
  return clients.filter((client) => {
    if (seen.has(client.id)) return false;
    seen.add(client.id);
    return true;
  });
};

export const getDemoClientsForUser = (actor: ServiceActor): Client[] => {
  const store = getDemoStore();
  return uniqueClients(store.clients.filter((client) => canViewClient(client, actor))).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
};

export const getDemoClientById = (clientId: string, actor: ServiceActor): Client | null => {
  const client = getDemoStore().clients.find((item) => item.id === clientId);
  if (!client) return null;
  return canViewClient(client, actor) ? client : null;
};

export const getDemoNotesForClient = (clientId: string): CaseNote[] => getDemoStore().caseNotes.filter((note) => note.clientId === clientId).sort((a, b) => b.contactDate.localeCompare(a.contactDate));
export const getDemoTasksForClient = (clientId: string): Task[] => getDemoStore().tasks.filter((task) => task.clientId === clientId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
export const getDemoReferralsForClient = (clientId: string): Referral[] => getDemoStore().referrals.filter((referral) => referral.clientId === clientId).sort((a, b) => b.referralDate.localeCompare(a.referralDate));
export const getDemoRiskFlagsForClient = (clientId: string): RiskFlag[] => getDemoStore().riskFlags.filter((flag) => flag.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getDemoSafetyPlansForClient = (clientId: string): SafetyPlan[] => getDemoStore().safetyPlans.filter((plan) => plan.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getDemoSupervisorReviewsForClient = (clientId: string): SupervisorReview[] => getDemoStore().supervisorReviews.filter((review) => review.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getDemoCaseworkerDashboard = (actor: ServiceActor) => {
  const clients = getDemoClientsForUser(actor);
  const store = getDemoStore();
  const todayKey = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const assignedIds = new Set(clients.map((client) => client.id));
  const overdueTasks = store.tasks.filter((task) => task.assignedToId === actor.id && ["open", "in_progress", "overdue"].includes(task.status) && task.dueDate < new Date().toISOString());
  const notesThisWeek = store.caseNotes.filter((note) => note.authorId === actor.id && new Date(note.createdAt) >= weekStart);
  const pendingReferrals = store.referrals.filter((referral) => assignedIds.has(referral.clientId) && ["pending", "no_response"].includes(referral.status));

  return {
    metrics: [
      { label: "Assigned clients", value: clients.length },
      { label: "Follow-ups due today", value: clients.filter((client) => client.nextFollowUpAt?.startsWith(todayKey)).length },
      { label: "Overdue follow-ups", value: clients.filter((client) => !!client.nextFollowUpAt && client.nextFollowUpAt < new Date().toISOString()).length, status: "warning" as const },
      { label: "High-priority clients", value: clients.filter((client) => client.priority === "high").length, status: "warning" as const },
      { label: "Notes completed this week", value: notesThisWeek.length },
      { label: "Pending referrals", value: pendingReferrals.length },
    ],
    assignedClients: clients,
    highPriorityClients: clients.filter((client) => client.priority === "high"),
    overdueTasks,
    notesThisWeek,
  };
};

export const getDemoSupervisorDashboard = (actor: ServiceActor) => {
  const clients = getDemoClientsForUser(actor);
  const store = getDemoStore();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const caseworkers = demoUsers.filter((user) => user.role === "caseworker");

  return {
    activeClients: clients.filter((client) => client.status === "active" || client.status === "follow_up_needed").length,
    activeCaseworkers: caseworkers.length,
    notesToday: store.caseNotes.filter((note) => note.contactDate.startsWith(new Date().toISOString().slice(0, 10))).length,
    notesThisWeek: store.caseNotes.filter((note) => new Date(note.createdAt) >= weekStart).length,
    highRiskClients: new Set(store.riskFlags.filter((risk) => risk.active && risk.severity === "high").map((risk) => risk.clientId)).size,
    overdueTasks: store.tasks.filter((task) => task.dueDate < new Date().toISOString() && task.status !== "completed").length,
    riskReviewsRequired: store.riskFlags.filter((risk) => risk.active && risk.supervisorReviewRequired).length,
    noContact7Days: clients.filter((client) => !client.lastContactAt || new Date(client.lastContactAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000).length,
  };
};

export const getDemoManagementDashboard = (_actor: ServiceActor) => {
  const store = getDemoStore();
  const activeClients = store.clients.filter((client) => ["active", "follow_up_needed", "intake"].includes(client.status));
  return {
    totalActiveClients: activeClients.length,
    housedClients: store.clients.filter((client) => client.status === "housed").length,
    dischargedClients: store.clients.filter((client) => client.status === "discharged").length,
    notesCompleted: store.caseNotes.length,
    referralsMade: store.referrals.length,
    followUpsOverdue: store.tasks.filter((task) => task.dueDate < new Date().toISOString() && task.status !== "completed").length,
    activeRiskFlags: store.riskFlags.filter((risk) => risk.active).length,
    safetyPlansDue: store.safetyPlans.filter((plan) => plan.status === "review_due").length,
  };
};

export const getDemoAuditLogs = (actor: ServiceActor): AuditLog[] => {
  const siteFilter = actor.role === "admin" || actor.role === "manager" ? null : new Set(actor.siteIds);
  return [...getBaseAuditLogs()]
    .filter((log) => !siteFilter || (log.siteId ? siteFilter.has(log.siteId) : true))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};
