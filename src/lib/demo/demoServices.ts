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
  ClientCaseworkState,
} from "@/types";
import { demoUsers } from "./demoData";
import { getBaseAuditLogs, getDemoStore } from "./demoStore";
import { buildClientCaseworkState } from "../casework/orchestration/caseworkOrchestrator";
import { generateSSANudges, generateManagerNudges } from "../casework/orchestration/nudgeEngine";


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
export const getDemoTasksForUser = (actor: ServiceActor): Task[] => {
  const store = getDemoStore();
  if (actor.role === "admin" || actor.role === "manager") return store.tasks;
  return store.tasks.filter(t => t.assignedToId === actor.id || (actor.role === "ssa" && actor.siteIds.includes(t.siteId)));
};
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


/**
 * Bundle all data for a single client into the shape needed by buildClientCaseworkState.
 */
export const getDemoClientFullData = (clientId: string) => {
  const store = getDemoStore();
  const client = store.clients.find((c) => c.id === clientId);
  if (!client) return null;
  return {
    client,
    notes: getDemoNotesForClient(clientId),
    tasks: getDemoTasksForClient(clientId),
    referrals: getDemoReferralsForClient(clientId),
    riskFlags: getDemoRiskFlagsForClient(clientId),
    safetyPlans: getDemoSafetyPlansForClient(clientId),
    generatedDocuments: getDemoGeneratedDocumentsForClient(clientId),
    clientNeeds: getDemoNeedsForClient(clientId),
    workstreams: getDemoWorkstreamsForClient(clientId),
    documentationChecklist: getDemoDocumentationChecklistForClient(clientId),
    documentChecklist: getDemoDocumentChecklistForClient(clientId),
    supervisorReviews: getDemoSupervisorReviewsForClient(clientId),
    timeline: getDemoTimelineForClient(clientId),
  };
};

export const getDemoCaseworkerDashboard = (actor: ServiceActor) => {
  const clients = getDemoClientsForUser(actor);
  const clientStates = clients.map(c => {
    const fullData = getDemoClientFullData(c.id);
    if (!fullData) return null;
    return buildClientCaseworkState({
      ...fullData,
      supervisorReviews: getDemoSupervisorReviewsForClient(c.id)
    });
  }).filter(Boolean) as ClientCaseworkState[];

  const todayKey = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const metrics = [
    { label: "Assigned clients", value: clients.length },
    { label: "High Priority", value: clientStates.filter(s => s.priorityLevel === "high").length, status: "warning" as const },
    { label: "Documentation Gaps", value: clientStates.filter(s => s.documentationStatus.overallCompletionPercent < 50).length },
    { label: "Safety Reviews Due", value: clientStates.filter(s => s.requiredPlans.some(p => p.type === "safety_plan" && p.status === "review_due")).length },
    { label: "Overdue Follow-ups", value: clientStates.reduce((acc, s) => acc + s.tasks.filter(t => t.status !== "completed" && t.dueDate < todayKey).length, 0), status: "warning" as const },
    { label: "Housing Ready", value: clientStates.filter(s => s.housingReadiness.level === "housing_ready").length },
    { label: "Notes this Week", value: clientStates.reduce((acc, s) => acc + s.notes.filter(n => new Date(n.createdAt) >= weekStart).length, 0) },
  ];

  const todayPriorityQueue = clientStates.flatMap(state => {
    return state.smartTasks.map(task => ({
      key: task.id,
      clientId: state.client.id,
      clientName: state.client.displayName,
      clientCode: state.client.clientCode,
      priority: task.priority,
      reason: task.reason,
      nextAction: task.title,
      dueDate: task.dueDate,
      workstream: task.relatedWorkstreamType || "general",
      badge: task.priority === "high" ? "Urgent" : "Action Required",
      risk: state.riskFlags.some(r => r.active) ? "Risk" : "",
      lastContactAt: state.client.lastContactAt || ""
    }));
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    metrics,
    assignedClients: clients,
    highPriorityClients: clients.filter((c) => c.priority === "high"),
    overdueTasks: clientStates.flatMap(s => s.tasks.filter(t => t.status !== "completed" && t.dueDate < todayKey)),
    notesThisWeek: clientStates.flatMap(s => s.notes.filter(n => new Date(n.createdAt) >= weekStart)),
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
  
  const clientStates = clients.map(c => {
    const fullData = getDemoClientFullData(c.id);
    if (!fullData) return null;
    return buildClientCaseworkState({
      ...fullData,
      supervisorReviews: getDemoSupervisorReviewsForClient(c.id)
    });
  }).filter(Boolean) as ClientCaseworkState[];

  const todayKey = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. UNASSIGNED CLIENTS
  const unassignedClients = store.clients.filter(c => 
    (c.assignedWorkerIds.length === 0 || c.status === "intake") && 
    canViewClient(c, actor)
  );

  // 2. CLIENT ATTENTION QUEUE (Nudges)
  const attentionQueue = clientStates.map(state => {
    const nudges = state.ssaNudges;
    return {
      client: state.client,
      assignedWorkers: caseworkers.filter(w => state.client.assignedWorkerIds.includes(w.id)),
      reasons: nudges.map(n => n.message),
      lastContactAt: state.client.lastContactAt,
      priority: state.client.priority,
      riskLevel: state.priorityLevel,
      gapCount: state.documentationStatus.items.filter(i => i.required && i.status === "missing").length
    };
  }).filter(item => item.reasons.length > 0);

  // 3. STAFF WORKLOAD
  const staffWorkload = caseworkers.map(worker => {
    const workerStates = clientStates.filter(s => s.client.assignedWorkerIds.includes(worker.id));
    const workerTasks = store.tasks.filter(t => t.assignedToId === worker.id && t.status !== "completed");
    const workerNotes = store.caseNotes.filter(n => n.authorId === worker.id && new Date(n.createdAt) >= sevenDaysAgo);
    
    const overdueCount = workerTasks.filter(t => t.dueDate < new Date().toISOString()).length;
    const highPriorityCount = workerStates.filter(s => s.priorityLevel === "high").length;

    let workloadStatus: 'balanced' | 'high' | 'overloaded' | 'support_needed' | 'low_activity' = 'balanced';
    if (workerStates.length > 8) workloadStatus = 'overloaded';
    else if (workerStates.length > 5 || overdueCount > 3) workloadStatus = 'high';
    else if (workerNotes.length === 0 && workerStates.length > 0) workloadStatus = 'low_activity';

    return {
      worker,
      clientCount: workerStates.length,
      highPriorityCount,
      overdueCount,
      notesThisWeek: workerNotes.length,
      pendingReferrals: store.referrals.filter(r => workerStates.some(s => s.client.id === r.clientId) && r.status === "pending").length,
      workloadStatus,
      lastActivity: workerNotes[0]?.createdAt || worker.updatedAt
    };
  });

  // 4. RISK & SAFETY QUEUE
  const riskQueue = clientStates.flatMap(state => {
    return state.riskFlags.filter(r => r.active && r.supervisorReviewRequired).map(risk => ({
      risk,
      client: state.client,
      worker: caseworkers.find(w => w.id === risk.createdById)
    }));
  });

  const safetyReviews = clientStates.flatMap(state => {
    return state.requiredPlans.filter(p => p.type === "safety_plan" && p.status === "review_due").map(plan => {
      const doc = state.generatedDocuments.find(d => d.type === "safety_plan" && d.status === "review_due");
      if (!doc) return null;
      return {
        doc,
        client: state.client,
        worker: caseworkers.find(w => w.id === doc.createdById)
      };
    }).filter(Boolean);
  }) as any[];

  // 5. DOCUMENTATION GAPS
  const documentationGaps = clientStates.map(state => {
    const gaps = state.documentationStatus.items.filter(i => i.required && i.status === "missing").map(i => i.label);
    return {
      client: state.client,
      assignedWorkers: caseworkers.filter(w => state.client.assignedWorkerIds.includes(w.id)),
      gaps,
      status: state.client.status
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
      noContact7Days: attentionQueue.filter(a => a.reasons.some(r => r.includes("No contact"))).length,
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

export const getDemoManagementDashboard = (actor: ServiceActor) => {
  const store = getDemoStore();
  const clients = getDemoClientsForUser(actor);
  
  const clientStates = clients.map(c => {
    const fullData = getDemoClientFullData(c.id);
    if (!fullData) return null;
    return buildClientCaseworkState({
      ...fullData,
      supervisorReviews: getDemoSupervisorReviewsForClient(c.id)
    });
  }).filter(Boolean) as ClientCaseworkState[];

  const activeClients = clients.filter((c) => ["active", "follow_up_needed", "intake"].includes(c.status));
  const tasks = store.tasks;
  const notes = store.caseNotes;
  const referrals = store.referrals;
  const risks = store.riskFlags;
  const safetyPlans = store.safetyPlans;
  const checklists = store.documentationChecklists;
  const workers = demoUsers.filter(u => u.role === "caseworker");

  const mtd = new Date();
  mtd.setDate(1); // Start of month
  const mtdStr = mtd.toISOString();

  // Aggregated Nudges for Management
  const managerNudges = generateManagerNudges({ 
    clientStates, 
    sites: store.sites 
  });

  const metrics = [
    { label: "Active clients", value: activeClients.length },
    { label: "New intakes", value: clients.filter(c => c.status === "intake").length },
    { label: "Clients housed (MTD)", value: clients.filter(c => c.status === "housed" && c.updatedAt >= mtdStr).length },
    { label: "Documentation Health", value: Math.round(clientStates.reduce((acc, s) => acc + s.documentationStatus.overallCompletionPercent, 0) / (clientStates.length || 1)) + "%" },
    { label: "Housing Readiness", value: Math.round(clientStates.reduce((acc, s) => acc + s.housingReadiness.score, 0) / (clientStates.length || 1)) + "%" },
    { label: "Average Caseload", value: Math.round(activeClients.length / (workers.length || 1)) },
    { label: "Management Nudges", value: managerNudges.length, status: managerNudges.length > 5 ? "warning" : "neutral" }
  ];

  return {
    metrics,
    programSnapshot: {
      totalClients: clients.length,
      activeClients: activeClients.length,
      housedMTD: clients.filter(c => c.status === "housed" && c.updatedAt >= mtdStr).length,
    },
    clientNeedsBreakdown: store.clientNeeds.reduce((acc: Record<string, number>, need) => {
      acc[need.needType] = (acc[need.needType] || 0) + 1;
      return acc;
    }, {}),
    workstreamStatusBreakdown: store.workstreams.reduce((acc: Record<string, number>, ws) => {
      acc[ws.status] = (acc[ws.status] || 0) + 1;
      return acc;
    }, {}),
    documentationCompletion: {
      intake: Math.round((clientStates.filter(s => s.documentationStatus.items.find(i => i.key === "intake_assessment")?.status === "completed").length / (clientStates.length || 1)) * 100),
      housing: Math.round((clientStates.filter(s => s.documentationStatus.items.find(i => i.key === "housing_plan")?.status === "completed").length / (clientStates.length || 1)) * 100),
      service: Math.round((clientStates.filter(s => s.documentationStatus.items.find(i => i.key === "service_plan")?.status === "completed").length / (clientStates.length || 1)) * 100),
    },
    housingOutcomes: {
      housed: clients.filter(c => c.status === "housed").length,
      transferred: clients.filter(c => c.status === "transferred").length,
      discharged: clients.filter(c => c.status === "discharged").length,
    },
    referralOutcomes: referrals.reduce((acc: Record<string, number>, ref) => {
      acc[ref.status] = (acc[ref.status] || 0) + 1;
      return acc;
    }, {}),
    staffWorkload: workers.map(w => ({
      name: `${w.firstName} ${w.lastName}`,
      caseload: clients.filter(c => c.assignedWorkerIds.includes(w.id)).length,
      overdueTasks: tasks.filter(t => t.assignedToId === w.id && t.status !== "completed" && t.dueDate < new Date().toISOString()).length
    })),
    riskSafetyOversight: {
      activeRisks: risks.filter(r => r.active).length,
      pendingSafetyReviews: safetyPlans.filter(p => p.status === "review_due").length,
    },
    siteComparison: store.sites.map(s => ({
      name: s.name,
      activeClients: clients.filter(c => c.siteId === s.id && ["active", "intake"].includes(c.status)).length,
      housedMTD: clients.filter(c => c.siteId === s.id && c.status === "housed" && c.updatedAt >= mtdStr).length
    })),
    managementInsights: [
      { type: "warning", message: `${tasks.filter(t => t.status !== "completed" && t.dueDate < new Date().toISOString()).length} follow-up tasks are currently overdue.` },
      { type: "info", message: `${clients.filter(c => c.status === "intake").length} clients currently in intake process.` }
    ],
    managerNudges
  };
};

export const getDemoAllRiskFlags = (): RiskFlag[] => {
  return getDemoStore().riskFlags;
};

export const getDemoAllSafetyPlans = (): SafetyPlan[] => {
  return getDemoStore().safetyPlans;
};

export const getDemoAllGeneratedDocuments = (): GeneratedDocument[] => {
  return getDemoStore().generatedDocuments;
};
export const getDemoAllSupervisorReviews = (): SupervisorReview[] => {
  return getDemoStore().supervisorReviews;
};
