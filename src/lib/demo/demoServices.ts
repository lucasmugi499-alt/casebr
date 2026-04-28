import {
  AuditLog,
  CaseNote,
  Client,
  ClientNeed,
  DocumentationChecklist,
  DocumentChecklist,
  GeneratedDocument,
  Referral,
  RiskFlag,
  SafetyPlan,
  ServiceActor,
  SupervisorReview,
  Task,
  TimelineItem,
  Workstream,
} from "@/types";
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
export const getDemoWorkstreamsForClient = (clientId: string): Workstream[] => getDemoStore().workstreams.filter((entry) => entry.clientId === clientId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
export const getDemoNeedsForClient = (clientId: string): ClientNeed[] => getDemoStore().clientNeeds.filter((entry) => entry.clientId === clientId);
export const getDemoGeneratedDocumentsForClient = (clientId: string): GeneratedDocument[] => getDemoStore().generatedDocuments.filter((entry) => entry.clientId === clientId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
export const getDemoDocumentationChecklistForClient = (clientId: string): DocumentationChecklist | null =>
  getDemoStore().documentationChecklists.find((entry) => entry.clientId === clientId) ?? null;
export const getDemoDocumentChecklistForClient = (clientId: string): DocumentChecklist | null =>
  getDemoStore().documentChecklists.find((entry) => entry.clientId === clientId) ?? null;

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

  const documentationGaps = store.documentationChecklists.filter(
    (check) => clients.some((client) => client.id === check.clientId) && (!check.intakeCompleted || !check.servicePlanStarted || !check.housingPlanStarted)
  ).length;
  const housingActionsPending = store.workstreams.filter(
    (ws) => clients.some((client) => client.id === ws.clientId) && ws.type === "housing" && ["in_progress", "waiting_on_agency", "waiting_on_client", "blocked"].includes(ws.status)
  ).length;
  const safetyReviewsDue = store.safetyPlans.filter(
    (plan) => clients.some((client) => client.id === plan.clientId) && new Date(plan.reviewDate).getTime() <= Date.now() + 24 * 60 * 60 * 1000
  ).length;

  type QueueItem = {
    key: string;
    reason: string;
    nextAction: string;
    dueDate: string;
    workstream: string;
    badge: string;
    risk: string;
  };

  const todayPriorityQueue = clients.flatMap((client) => {
    const clientTasks = store.tasks.filter((task) => task.clientId === client.id && ["open", "in_progress", "overdue"].includes(task.status));
    const clientReferrals = store.referrals.filter((ref) => ref.clientId === client.id && ["pending", "no_response"].includes(ref.status));
    const clientRisk = store.riskFlags.filter((risk) => risk.clientId === client.id && risk.active);
    const clientWorkstreams = store.workstreams.filter((ws) => ws.clientId === client.id);
    const noContact = !client.lastContactAt || new Date(client.lastContactAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000;
    const queue: QueueItem[] = [];
    clientTasks.forEach((task) => {
      if (task.dueDate.slice(0, 10) <= todayKey) {
        queue.push({
          key: `${client.id}-${task.id}`,
          reason: task.dueDate.slice(0, 10) < todayKey ? "Follow-up overdue" : "Follow-up due today",
          nextAction: task.title,
          dueDate: task.dueDate,
          workstream: "general",
          badge: task.dueDate.slice(0, 10) < todayKey ? "Overdue" : "Due Today",
          risk: clientRisk.length ? "Risk" : "",
        });
      }
    });
    clientReferrals.forEach((referral) => {
      if (new Date(referral.referralDate).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000) {
        queue.push({
          key: `${client.id}-${referral.id}`,
          reason: "Referral waiting too long",
          nextAction: `Follow up with ${referral.agencyName}`,
          dueDate: referral.followUpDate ?? referral.referralDate,
          workstream: referral.referralType,
          badge: "Referral",
          risk: clientRisk.length ? "Risk" : "",
        });
      }
    });
    clientWorkstreams
      .filter((ws) => ws.status === "blocked" || (ws.type === "housing" && ["waiting_on_agency", "in_progress"].includes(ws.status)))
      .forEach((ws) =>
        queue.push({
          key: `${client.id}-${ws.id}`,
          reason: ws.status === "blocked" ? "Workstream blocked" : "Housing action pending",
          nextAction: ws.nextAction,
          dueDate: ws.dueDate ?? client.nextFollowUpAt ?? new Date().toISOString(),
          workstream: ws.type,
          badge: ws.status === "blocked" ? "Blocked" : "Housing",
          risk: clientRisk.length ? "Risk" : "",
        })
      );
    if (noContact) {
      queue.push({
        key: `${client.id}-no-contact`,
        reason: "No contact in 7+ days",
        nextAction: "Add contact note and schedule follow-up.",
        dueDate: client.nextFollowUpAt ?? new Date().toISOString(),
        workstream: "engagement",
        badge: "High Priority",
        risk: clientRisk.length ? "Risk" : "",
      });
    }
    return queue.map((item) => ({ ...item, clientId: client.id, clientName: client.displayName, clientCode: client.clientCode, priority: client.priority, lastContactAt: client.lastContactAt ?? "" }));
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    metrics: [
      { label: "Assigned clients", value: clients.length },
      { label: "Due Today", value: clients.filter((client) => client.nextFollowUpAt?.startsWith(todayKey)).length },
      { label: "Overdue", value: clients.filter((client) => !!client.nextFollowUpAt && client.nextFollowUpAt < new Date().toISOString()).length, status: "warning" as const },
      { label: "High Priority", value: clients.filter((client) => client.priority === "high").length, status: "warning" as const },
      { label: "Pending Referrals", value: pendingReferrals.length },
      { label: "Documentation Gaps", value: documentationGaps },
      { label: "Safety Reviews Due", value: safetyReviewsDue },
      { label: "Housing Actions Pending", value: housingActionsPending },
      { label: "Notes completed this week", value: notesThisWeek.length },
    ],
    assignedClients: clients,
    highPriorityClients: clients.filter((client) => client.priority === "high"),
    overdueTasks,
    notesThisWeek,
    todayPriorityQueue,
  };
};

export const getDemoTimelineForClient = (clientId: string): TimelineItem[] => {
  const store = getDemoStore();
  const notes = getDemoNotesForClient(clientId).map((note) => ({
    id: `note-${note.id}`,
    type: "case_note" as const,
    date: note.contactDate,
    title: "Case note",
    summary: note.finalNote,
    staffId: note.authorId,
    entityId: note.id,
    entityType: "caseNote",
  }));
  const tasks = getDemoTasksForClient(clientId).map((task) => ({
    id: `task-${task.id}`,
    type: "task" as const,
    date: task.updatedAt,
    title: task.title,
    summary: task.description,
    staffId: task.assignedToId,
    entityId: task.id,
    entityType: "task",
    status: task.status,
  }));
  const referrals = getDemoReferralsForClient(clientId).map((referral) => ({
    id: `ref-${referral.id}`,
    type: "referral" as const,
    date: referral.referralDate,
    title: `${referral.referralType} referral`,
    summary: `${referral.agencyName} • ${referral.status}`,
    staffId: referral.createdById,
    entityId: referral.id,
    entityType: "referral",
    status: referral.status,
  }));
  const docs = getDemoGeneratedDocumentsForClient(clientId).map((doc) => ({
    id: `doc-${doc.id}`,
    type: doc.type === "housing_plan" ? ("housing_plan" as const) : ("service_plan" as const),
    date: doc.updatedAt,
    title: doc.title,
    summary: `Document status: ${doc.status}`,
    staffId: doc.createdById,
    entityId: doc.id,
    entityType: "generatedDocument",
    status: doc.status,
  }));
  const manualTimeline = store.timelineItems.filter((item) => item.entityId.startsWith(clientId));
  return [...notes, ...tasks, ...referrals, ...docs, ...manualTimeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
