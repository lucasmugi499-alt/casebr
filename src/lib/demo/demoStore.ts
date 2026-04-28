import {
  CaseNote,
  Client,
  ClientNeed,
  DocumentationChecklist,
  DocumentChecklist,
  GeneratedDocument,
  Referral,
  RiskFlag,
  SafetyPlan,
  SupervisorReview,
  Task,
  TimelineItem,
  Workstream,
} from "@/types";
import {
  demoAuditLogs,
  demoCaseNotes,
  demoClientNeeds,
  demoClients,
  demoDocumentationChecklists,
  demoDocumentChecklists,
  demoGeneratedDocuments,
  demoReferrals,
  demoRiskFlags,
  demoSafetyPlans,
  demoSupervisorReviews,
  demoTasks,
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

export const addDemoReferral = (referral: Omit<Referral, "createdAt" | "updatedAt"> & Partial<Pick<Referral, "createdAt" | "updatedAt">>): Referral => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.referrals, referral);
  const created = next[0];
  saveDemoStore({ ...store, referrals: next });
  return created;
};

export const addDemoRiskFlag = (riskFlag: Omit<RiskFlag, "createdAt" | "updatedAt"> & Partial<Pick<RiskFlag, "createdAt" | "updatedAt">>): RiskFlag => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.riskFlags, riskFlag);
  const created = next[0];
  saveDemoStore({ ...store, riskFlags: next });
  return created;
};

export const addDemoSafetyPlan = (safetyPlan: Omit<SafetyPlan, "createdAt" | "updatedAt"> & Partial<Pick<SafetyPlan, "createdAt" | "updatedAt">>): SafetyPlan => {
  const store = getDemoStore();
  const next = addWithTimestamp(store.safetyPlans, safetyPlan);
  const created = next[0];
  saveDemoStore({ ...store, safetyPlans: next });
  return created;
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

export const upsertDemoGeneratedDocument = (document: GeneratedDocument): GeneratedDocument => {
  const store = getDemoStore();
  const existing = store.generatedDocuments.find((entry) => entry.id === document.id);
  const nextDocs = existing
    ? store.generatedDocuments.map((entry) => (entry.id === document.id ? { ...entry, ...document, updatedAt: new Date().toISOString() } : entry))
    : [{ ...document, createdAt: document.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }, ...store.generatedDocuments];
  saveDemoStore({ ...store, generatedDocuments: nextDocs });
  return nextDocs[0];
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
