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
    (check) => clients.some((client) => client.id === check.clientId) && 
    (!check.intakeCompleted || !check.servicePlanCompleted || !check.housingPlanStarted || !check.safetyPlanCompleted)
  ).length;

  const housingActionsPending = store.workstreams.filter(
    (ws) => clients.some((client) => client.id === ws.clientId) && ws.type === "housing" && ["in_progress", "waiting_on_agency", "waiting_on_client", "blocked"].includes(ws.status)
  ).length;

  const safetyReviewsDue = store.generatedDocuments.filter(
    (doc) => doc.type === "safety_plan" && 
    clients.some((client) => client.id === doc.clientId) && 
    (doc.status === "review_due" || (doc.reviewDate && new Date(doc.reviewDate).getTime() <= Date.now()))
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
    clientId,
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
    clientId,
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
    clientId,
    type: "referral" as const,
    date: referral.referralDate,
    title: `${referral.referralType.replace("_", " ")} referral`,
    summary: `${referral.agencyName} • ${referral.status}`,
    staffId: referral.createdById,
    entityId: referral.id,
    entityType: "referral",
    status: referral.status,
  }));
  const riskFlags = getDemoRiskFlagsForClient(clientId).map((flag) => ({
    id: `risk-${flag.id}`,
    clientId,
    type: "risk_flag" as const,
    date: flag.createdAt,
    title: `Risk Flag: ${flag.category}`,
    summary: flag.description,
    staffId: flag.createdById,
    entityId: flag.id,
    entityType: "riskFlag",
    status: flag.active ? "active" : "resolved",
  }));
  const safetyPlans = getDemoSafetyPlansForClient(clientId).map((plan) => ({
    id: `safety-${plan.id}`,
    clientId,
    type: "safety_plan" as const,
    date: plan.updatedAt,
    title: "Safety Plan Updated",
    summary: plan.concernSummary,
    staffId: plan.createdById,
    entityId: plan.id,
    entityType: "safetyPlan",
    status: plan.status,
  }));
  const docs = getDemoGeneratedDocumentsForClient(clientId).map((doc) => ({
    id: `doc-${doc.id}`,
    clientId,
    type: "generated_document" as const,
    date: doc.updatedAt,
    title: doc.title,
    summary: `Document status: ${doc.status}`,
    staffId: doc.createdById,
    entityId: doc.id,
    entityType: "generatedDocument",
    status: doc.status,
  }));
  const reviews = getDemoSupervisorReviewsForClient(clientId).map((review) => ({
    id: `review-${review.id}`,
    clientId,
    type: "supervisor_review" as const,
    date: review.createdAt,
    title: "Supervisor Review",
    summary: review.comment,
    staffId: review.supervisorId,
    entityId: review.id,
    entityType: "supervisorReview",
  }));
  
  const manualTimeline = store.timelineItems.filter((item) => item.clientId === clientId);
  
  return [...notes, ...tasks, ...referrals, ...riskFlags, ...safetyPlans, ...docs, ...reviews, ...manualTimeline]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getSupervisorOperationalBoard = (actor: ServiceActor) => {
  const store = getDemoStore();
  const clients = getDemoClientsForUser(actor);
  const caseworkers = demoUsers.filter((user) => user.role === "caseworker" && (actor.role === "admin" || actor.role === "manager" || actor.siteIds.some(s => user.siteIds.includes(s))));
  
  const todayKey = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. UNASSIGNED CLIENTS
  const unassignedClients = store.clients.filter(c => 
    (c.assignedWorkerIds.length === 0 || c.status === "intake") && 
    canViewClient(c, actor)
  );

  // 2. CLIENT ATTENTION QUEUE
  const attentionQueue = clients.map(client => {
    const reasons: string[] = [];
    const clientTasks = store.tasks.filter(t => t.clientId === client.id && t.status !== "completed");
    const clientNotes = store.caseNotes.filter(n => n.clientId === client.id);
    const clientRisk = store.riskFlags.filter(r => r.clientId === client.id && r.active);
    const clientDocs = store.generatedDocuments.filter(d => d.clientId === client.id);
    const checklist = store.documentationChecklists.find(ch => ch.clientId === client.id);

    if (clientTasks.some(t => t.dueDate < new Date().toISOString())) reasons.push("Overdue follow-up");
    if (!client.lastContactAt || new Date(client.lastContactAt) < sevenDaysAgo) reasons.push("No contact in 7+ days");
    if (clientRisk.some(r => r.severity === "high")) reasons.push("Active high-risk flag");
    if (clientDocs.some(d => d.type === "safety_plan" && d.status === "review_due")) reasons.push("Safety plan review due");
    if (!checklist?.housingPlanStarted) reasons.push("Housing plan missing");
    if (!checklist?.servicePlanStarted) reasons.push("Service plan missing");
    if (client.status === "intake" && !checklist?.intakeCompleted) reasons.push("Intake incomplete");

    return {
      client,
      assignedWorkers: caseworkers.filter(w => client.assignedWorkerIds.includes(w.id)),
      reasons,
      lastContactAt: client.lastContactAt,
      priority: client.priority,
      riskLevel: clientRisk.length > 0 ? "high" : "normal",
      gapCount: reasons.filter(r => r.includes("missing") || r.includes("incomplete")).length
    };
  }).filter(item => item.reasons.length > 0);

  // 3. STAFF WORKLOAD
  const staffWorkload = caseworkers.map(worker => {
    const workerClients = store.clients.filter(c => c.assignedWorkerIds.includes(worker.id));
    const workerTasks = store.tasks.filter(t => t.assignedToId === worker.id && t.status !== "completed");
    const workerNotes = store.caseNotes.filter(n => n.authorId === worker.id && new Date(n.createdAt) >= sevenDaysAgo);
    
    const overdueCount = workerTasks.filter(t => t.dueDate < new Date().toISOString()).length;
    const highPriorityCount = workerClients.filter(c => c.priority === "high").length;

    let workloadStatus: 'balanced' | 'high' | 'overloaded' | 'support_needed' | 'low_activity' = 'balanced';
    if (workerClients.length > 8) workloadStatus = 'overloaded';
    else if (workerClients.length > 5 || overdueCount > 3) workloadStatus = 'high';
    else if (workerNotes.length === 0 && workerClients.length > 0) workloadStatus = 'low_activity';

    return {
      worker,
      clientCount: workerClients.length,
      highPriorityCount,
      overdueCount,
      notesThisWeek: workerNotes.length,
      pendingReferrals: store.referrals.filter(r => workerClients.some(c => c.id === r.clientId) && r.status === "pending").length,
      workloadStatus,
      lastActivity: workerNotes[0]?.createdAt || worker.updatedAt
    };
  });

  // 4. RISK & SAFETY QUEUE
  const riskQueue = store.riskFlags.filter(r => 
    r.active && r.supervisorReviewRequired && 
    clients.some(c => c.id === r.clientId)
  ).map(risk => ({
    risk,
    client: clients.find(c => c.id === risk.clientId),
    worker: caseworkers.find(w => w.id === risk.createdById)
  }));

  const safetyReviews = store.generatedDocuments.filter(d => 
    d.type === "safety_plan" && d.status === "review_due" &&
    clients.some(c => c.id === d.clientId)
  ).map(doc => ({
    doc,
    client: clients.find(c => c.id === doc.clientId),
    worker: caseworkers.find(w => w.id === doc.createdById)
  }));

  // 5. DOCUMENTATION GAPS
  const documentationGaps = clients.map(client => {
    const checklist = store.documentationChecklists.find(ch => ch.clientId === client.id);
    const gaps: string[] = [];
    if (!checklist?.intakeCompleted) gaps.push("Intake Assessment");
    if (!checklist?.servicePlanStarted) gaps.push("Service Plan");
    if (!checklist?.housingPlanStarted) gaps.push("Housing Plan");
    
    return {
      client,
      assignedWorkers: caseworkers.filter(w => client.assignedWorkerIds.includes(w.id)),
      gaps,
      status: client.status
    };
  }).filter(item => item.gaps.length > 0);

  // 6. RECENT TEAM ACTIVITY
  const recentActivity = store.auditLogs.slice(0, 20).map(log => ({
    ...log,
    user: demoUsers.find(u => u.id === log.userId),
    client: store.clients.find(c => c.id === log.entityId)
  }));

  return {
    summary: {
      unassignedCount: unassignedClients.length,
      activeClients: clients.filter(c => c.status === "active").length,
      activeCaseworkers: caseworkers.length,
      overdueTasks: store.tasks.filter(t => t.status !== "completed" && t.dueDate < new Date().toISOString()).length,
      riskReviewsRequired: riskQueue.length + safetyReviews.length,
      documentationGaps: documentationGaps.length,
      noContact7Days: attentionQueue.filter(a => a.reasons.includes("No contact in 7+ days")).length,
    },
    unassignedClients,
    attentionQueue,
    staffWorkload,
    riskQueue,
    safetyReviews,
    documentationGaps,
    recentActivity,
    caseworkers
  };
};

export const getDemoAuditLogs = (actor: ServiceActor): AuditLog[] => {
  const siteFilter = actor.role === "admin" || actor.role === "manager" ? null : new Set(actor.siteIds);
  const store = getDemoStore();
  return [...store.auditLogs]
    .filter((log) => !siteFilter || (log.siteId ? siteFilter.has(log.siteId) : true))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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
