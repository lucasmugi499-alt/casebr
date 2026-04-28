import {
  TimelineItem,
  Workstream,
  AuditLog,
  Site,
  Organization,
  User,
} from "@/types";
import {
  demoAuditLogs,
  demoCaseNotes,
  demoClientNeeds,
  demoClients,
  demoDocumentationChecklists,
  demoDocumentChecklists,
  demoGeneratedDocuments,
  demoOrganization,
  demoReferrals,
  demoRiskFlags,
  demoSafetyPlans,
  demoSites,
  demoSupervisorReviews,
  demoTasks,
  demoUsers,
  demoWorkstreams,
} from "./demoData";

const STORE_KEY = "casebridge_demo_store_v1";

export interface DemoStore {
  clients: Client[];
  caseNotes: CaseNote[];
  tasks: Task[];
  referrals: Referral[];
  riskFlags: RiskFlag[];
  safetyPlans: SafetyPlan[];
  supervisorReviews: SupervisorReview[];
  workstreams: Workstream[];
  clientNeeds: ClientNeed[];
  documentationChecklists: DocumentationChecklist[];
  documentChecklists: DocumentChecklist[];
  generatedDocuments: GeneratedDocument[];
  timelineItems: TimelineItem[];
  auditLogs: AuditLog[];
  users: User[];
  sites: Site[];
  organization: Organization | null;
}

const baseStore: DemoStore = {
  clients: demoClients,
  caseNotes: demoCaseNotes,
  tasks: demoTasks,
  referrals: demoReferrals,
  riskFlags: demoRiskFlags,
  safetyPlans: demoSafetyPlans,
  supervisorReviews: demoSupervisorReviews,
  workstreams: demoWorkstreams,
  clientNeeds: demoClientNeeds,
  documentationChecklists: demoDocumentationChecklists,
  documentChecklists: demoDocumentChecklists,
  generatedDocuments: demoGeneratedDocuments,
  timelineItems: [],
  auditLogs: demoAuditLogs,
  users: demoUsers,
  sites: demoSites,
  organization: demoOrganization,
};

const cloneBaseStore = (): DemoStore => ({
  clients: [...baseStore.clients],
  caseNotes: [...baseStore.caseNotes],
  tasks: [...baseStore.tasks],
  referrals: [...baseStore.referrals],
  riskFlags: [...baseStore.riskFlags],
  safetyPlans: [...baseStore.safetyPlans],
  supervisorReviews: [...baseStore.supervisorReviews],
  workstreams: [...baseStore.workstreams],
  clientNeeds: [...baseStore.clientNeeds],
  documentationChecklists: [...baseStore.documentationChecklists],
  documentChecklists: [...baseStore.documentChecklists],
  generatedDocuments: [...baseStore.generatedDocuments],
  timelineItems: [...baseStore.timelineItems],
  auditLogs: [...baseStore.auditLogs],
  users: [...baseStore.users],
  sites: [...baseStore.sites],
  organization: baseStore.organization ? { ...baseStore.organization } : null,
});

export const getDemoStore = (): DemoStore => {
  if (typeof window === "undefined") return cloneBaseStore();
  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const fresh = cloneBaseStore();
    saveDemoStore(fresh);
    return fresh;
  }

  try {
    return { ...cloneBaseStore(), ...JSON.parse(raw) } as DemoStore;
  } catch {
    const fresh = cloneBaseStore();
    saveDemoStore(fresh);
    return fresh;
  }
};

export const saveDemoStore = (store: DemoStore): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
};

export const resetDemoStore = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORE_KEY);
};

const addWithTimestamp = <T extends { id: string; createdAt: string; updatedAt: string }>(
  collection: T[],
  entity: Omit<T, "createdAt" | "updatedAt"> & Partial<Pick<T, "createdAt" | "updatedAt">>
) => {
  const timestamp = new Date().toISOString();
  return [{ ...entity, createdAt: entity.createdAt ?? timestamp, updatedAt: entity.updatedAt ?? timestamp } as T, ...collection];
};

export const addDemoClient = (client: Omit<Client, "createdAt" | "updatedAt"> & Partial<Pick<Client, "createdAt" | "updatedAt">>): Client => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.clients, client);
  const created = next[0];
  saveDemoStore({ ...store, clients: next });
  return created;
};

export const addDemoCaseNote = (note: Omit<CaseNote, "createdAt" | "updatedAt"> & Partial<Pick<CaseNote, "createdAt" | "updatedAt">>): CaseNote => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.caseNotes, note);
  const created = next[0];
  const clients = store.clients.map((client) =>
    client.id === created.clientId ? { ...client, lastContactAt: created.contactDate, updatedAt: created.updatedAt } : client
  );
  saveDemoStore({ ...store, caseNotes: next, clients });
  return created;
};

export const addDemoTask = (task: Omit<Task, "createdAt" | "updatedAt"> & Partial<Pick<Task, "createdAt" | "updatedAt">>): Task => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.tasks, task);
  const created = next[0];
  saveDemoStore({ ...store, tasks: next });
  return created;
};

export const updateDemoTask = (taskId: string, updates: Partial<Omit<Task, "id" | "createdAt">>): Task | null => {
  const store = getDemoStore();
  const existing = store.tasks.find(t => t.id === taskId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    tasks: store.tasks.map(t => t.id === taskId ? updated : t)
  });
  return updated;
};

export const addDemoReferral = (referral: Omit<Referral, "createdAt" | "updatedAt"> & Partial<Pick<Referral, "createdAt" | "updatedAt">>): Referral => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.referrals, referral);
  const created = next[0];
  saveDemoStore({ ...store, referrals: next });
  return created;
};

export const updateDemoReferral = (referralId: string, updates: Partial<Omit<Referral, "id" | "createdAt">>): Referral | null => {
  const store = getDemoStore();
  const existing = store.referrals.find(r => r.id === referralId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    referrals: store.referrals.map(r => r.id === referralId ? updated : r)
  });
  return updated;
};

export const addDemoRiskFlag = (riskFlag: Omit<RiskFlag, "createdAt" | "updatedAt"> & Partial<Pick<RiskFlag, "createdAt" | "updatedAt">>): RiskFlag => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.riskFlags, riskFlag);
  const created = next[0];
  saveDemoStore({ ...store, riskFlags: next });
  return created;
};

export const updateDemoRiskFlag = (flagId: string, updates: Partial<Omit<RiskFlag, "id" | "createdAt">>): RiskFlag | null => {
  const store = getDemoStore();
  const existing = store.riskFlags.find(r => r.id === flagId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    riskFlags: store.riskFlags.map(r => r.id === flagId ? updated : r)
  });
  return updated;
};

export const addDemoSafetyPlan = (safetyPlan: Omit<SafetyPlan, "createdAt" | "updatedAt"> & Partial<Pick<SafetyPlan, "createdAt" | "updatedAt">>): SafetyPlan => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.safetyPlans, safetyPlan);
  const created = next[0];
  saveDemoStore({ ...store, safetyPlans: next });
  return created;
};

export const updateDemoSafetyPlan = (planId: string, updates: Partial<Omit<SafetyPlan, "id" | "createdAt">>): SafetyPlan | null => {
  const store = getDemoStore();
  const existing = store.safetyPlans.find(s => s.id === planId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    safetyPlans: store.safetyPlans.map(s => s.id === planId ? updated : s)
  });
  return updated;
};

export const addDemoSupervisorReview = (
  review: Omit<SupervisorReview, "createdAt" | "updatedAt"> & Partial<Pick<SupervisorReview, "createdAt" | "updatedAt">>
): SupervisorReview => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.supervisorReviews, review);
  const created = next[0];
  saveDemoStore({ ...store, supervisorReviews: next });
  return created;
};

export const getBaseAuditLogs = () => demoAuditLogs;

export const addDemoGeneratedDocument = (document: GeneratedDocument): GeneratedDocument => {
  const store = getDemoStore();
  const nextDocs = [{ ...document, createdAt: document.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }, ...store.generatedDocuments];
  saveDemoStore({ ...store, generatedDocuments: nextDocs });
  return nextDocs[0];
};

export const updateDemoGeneratedDocument = (documentId: string, updates: Partial<Omit<GeneratedDocument, "id" | "createdAt">>): GeneratedDocument | null => {
  const store = getDemoStore();
  const existing = store.generatedDocuments.find(d => d.id === documentId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    generatedDocuments: store.generatedDocuments.map(d => d.id === documentId ? updated : d)
  });
  return updated;
};

export const upsertDemoGeneratedDocument = (document: GeneratedDocument): GeneratedDocument => {
  const existing = getDemoStore().generatedDocuments.find(d => d.id === document.id);
  if (existing) return updateDemoGeneratedDocument(document.id, document)!;
  return addDemoGeneratedDocument(document);
};

export const addDemoTimelineItem = (item: TimelineItem): TimelineItem => {
  const store = getDemoStore();
  const timelineItems = [{ ...item }, ...store.timelineItems];
  saveDemoStore({ ...store, timelineItems });
  return timelineItems[0];
};

export const updateDemoDocumentationChecklist = (
  clientId: string,
  updates: Partial<Omit<DocumentationChecklist, "clientId" | "updatedAt">>
): DocumentationChecklist | null => {
  const store = getDemoStore();
  const existing = store.documentationChecklists.find((entry) => entry.clientId === clientId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    documentationChecklists: store.documentationChecklists.map((entry) => (entry.clientId === clientId ? updated : entry)),
  });
  return updated;
};

export const updateDemoDocumentChecklist = (
  clientId: string,
  updates: Partial<Omit<DocumentChecklist, "clientId" | "updatedAt">>
): DocumentChecklist | null => {
  const store = getDemoStore();
  const existing = store.documentChecklists.find((entry) => entry.clientId === clientId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    documentChecklists: store.documentChecklists.map((entry) => (entry.clientId === clientId ? updated : entry)),
  });
  return updated;
};

export const addDemoWorkstream = (workstream: Workstream): Workstream => {
  const store = getDemoStore();
  const next = [workstream, ...store.workstreams];
  saveDemoStore({ ...store, workstreams: next });
  return workstream;
};

export const updateDemoWorkstream = (
  clientId: string,
  workstreamType: Workstream["type"],
  updates: Partial<Omit<Workstream, "id" | "clientId" | "type">>
): Workstream | null => {
  const store = getDemoStore();
  const existing = store.workstreams.find((ws) => ws.clientId === clientId && ws.type === workstreamType);
  if (!existing) return null;
  const updated: Workstream = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    workstreams: store.workstreams.map((ws) => (ws.id === existing.id ? updated : ws)),
  });
  return updated;
};

export const updateDemoClient = (clientId: string, updates: Partial<Omit<Client, "id" | "organizationId" | "siteId">>): Client | null => {
  const store = getDemoStore();
  const existing = store.clients.find((c) => c.id === clientId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    clients: store.clients.map((c) => (c.id === clientId ? updated : c)),
  });
  return updated;
};

export const assignDemoClient = (
  clientId: string,
  workerIds: string[],
  note?: string,
  actorId?: string
): Client | null => {
  const store = getDemoStore();
  const client = store.clients.find((c) => c.id === clientId);
  if (!client) return null;

  const updatedClient = updateDemoClient(clientId, {
    assignedWorkerIds: workerIds,
    status: client.status === "intake" ? "active" : client.status,
  });

  if (updatedClient) {
    // Add timeline item
    addDemoTimelineItem({
      id: `assign_${Date.now()}`,
      type: "task",
      date: new Date().toISOString(),
      title: "Client Assigned",
      summary: note || `Client assigned to ${workerIds.length} worker(s).`,
      staffId: actorId || "system",
      entityId: clientId,
      entityType: "client",
      status: "completed",
    });

    // Add Audit Log
    const log: AuditLog = {
      id: `audit_assign_${Date.now()}`,
      organizationId: client.organizationId,
      siteId: client.siteId,
      userId: actorId || "system",
      action: "assign_client",
      entityType: "client",
      entityId: clientId,
      timestamp: new Date().toISOString(),
      metadata: { workerIds, note },
    };
    const nextLogs = [log, ...store.auditLogs];
    saveDemoStore({ ...store, auditLogs: nextLogs });
  }

  return updatedClient;
};

export const addDemoUser = (user: User): User => {
  const store = getDemoStore();
  const next = [user, ...store.users];
  saveDemoStore({ ...store, users: next });
  return user;
};

export const updateDemoUser = (userId: string, updates: Partial<User>): User | null => {
  const store = getDemoStore();
  const existing = store.users.find(u => u.id === userId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    users: store.users.map(u => u.id === userId ? updated : u)
  });
  return updated;
};

export const addDemoSite = (site: Site): Site => {
  const store = getDemoStore();
  const next = [site, ...store.sites];
  saveDemoStore({ ...store, sites: next });
  return site;
};

export const updateDemoSite = (siteId: string, updates: Partial<Site>): Site | null => {
  const store = getDemoStore();
  const existing = store.sites.find(s => s.id === siteId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({
    ...store,
    sites: store.sites.map(s => s.id === siteId ? updated : s)
  });
  return updated;
};

export const updateDemoOrganization = (updates: Partial<Organization>): Organization | null => {
  const store = getDemoStore();
  if (!store.organization) return null;
  const updated = { ...store.organization, ...updates, updatedAt: new Date().toISOString() };
  saveDemoStore({ ...store, organization: updated });
  return updated;
};

export const addDemoAuditLog = (log: Omit<AuditLog, "id" | "timestamp">): AuditLog => {
  const store = getDemoStore();
  const newLog: AuditLog = {
    ...log,
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  saveDemoStore({ ...store, auditLogs: [newLog, ...store.auditLogs] });
  return newLog;
};

export const addDemoClientNeed = (need: ClientNeed): ClientNeed => {
  const store = getDemoStore();
  const next = [need, ...store.clientNeeds];
  saveDemoStore({ ...store, clientNeeds: next });
  return need;
};

export const updateDemoClientNeed = (
  clientId: string,
  needType: ClientNeed["needType"],
  updates: Partial<Omit<ClientNeed, "id" | "clientId" | "needType">>
): ClientNeed | null => {
  const store = getDemoStore();
  const existing = store.clientNeeds.find((n) => n.clientId === clientId && n.needType === needType);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  saveDemoStore({
    ...store,
    clientNeeds: store.clientNeeds.map((n) => (n.id === existing.id ? updated : n)),
  });
  return updated;
};
