import {
  Client,
  ServiceActor,
  GeneratedDocumentType,
  ClientNeedType,
  WorkstreamType,
  DocumentationChecklist,
  ClientNeed,
  TimelineItem,
  GeneratedDocument,
  Task,
  Referral,
  ClientStatus,
  SupervisorReview,
  CaseNote
} from "@/types";
import { 
  upsertDemoGeneratedDocument, 
  updateDemoDocumentationChecklist, 
  updateDemoClientNeed, 
  updateDemoWorkstream, 
  addDemoTimelineItem, 
  addDemoAuditLog,
  addDemoTask,
  addDemoReferral,
  updateDemoClient,
  getDemoStore,
  addDemoSupervisorReview,
  addDemoCaseNote,
  updateDemoCaseNote
} from "./demoStore";

export interface GeneratedDocumentWorkflowInput {
  client: Client;
  actor: ServiceActor;
  documentType: GeneratedDocumentType;
  title: string;
  generatedText: string;
  sourceAnswers: Record<string, any>;
  relatedNeedType?: ClientNeedType;
  relatedWorkstreamType?: WorkstreamType;
  checklistUpdates?: Partial<Omit<DocumentationChecklist, "clientId" | "updatedAt">>;
  reviewDate?: string;
  createTask?: boolean;
  taskData?: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">> | Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>[];
  createReferral?: boolean;
  referralData?: Partial<Omit<Referral, "id" | "createdAt" | "updatedAt">> | Partial<Omit<Referral, "id" | "createdAt" | "updatedAt">>[];
  statusUpdate?: ClientStatus;
  supervisorReviewRequested?: boolean;
  createClientNeeds?: boolean;
  clientNeedsData?: Partial<Omit<ClientNeed, "id" | "clientId" | "createdAt" | "updatedAt">>[];
}

export const completeDemoGeneratedDocumentWorkflow = (input: GeneratedDocumentWorkflowInput): GeneratedDocument => {
  const {
    client,
    actor,
    documentType,
    title,
    generatedText,
    sourceAnswers,
    relatedNeedType,
    relatedWorkstreamType,
    checklistUpdates,
    reviewDate,
    createTask,
    taskData,
    createReferral,
    referralData,
    statusUpdate,
    supervisorReviewRequested,
    createClientNeeds,
    clientNeedsData
  } = input;

  const timestamp = new Date().toISOString();

  // 1. Create or upsert GeneratedDocument
  const doc: GeneratedDocument = {
    id: `${documentType}_${client.id}`,
    clientId: client.id,
    organizationId: client.organizationId,
    siteId: client.siteId,
    type: documentType,
    title,
    status: "completed",
    generatedText,
    sourceAnswers,
    createdById: actor.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    reviewDate
  };
  const savedDoc = upsertDemoGeneratedDocument(doc);

  // 2. Update documentation checklist
  if (checklistUpdates) {
    updateDemoDocumentationChecklist(client.id, checklistUpdates);
  }

  // 3. Update related ClientNeed
  if (relatedNeedType) {
    updateDemoClientNeed(client.id, relatedNeedType, {
      status: "completed",
    });
  }

  // 4. Update related Workstream
  if (relatedWorkstreamType) {
    updateDemoWorkstream(client.id, relatedWorkstreamType, {
      status: "completed",
      updatedAt: timestamp
    });
  }

  // 5. Add TimelineItem
  addDemoTimelineItem({
    id: `tl_${documentType}_${Date.now()}`,
    clientId: client.id,
    type: "generated_document",
    date: timestamp,
    title: `${title} Created`,
    summary: `Document type: ${documentType.replace("_", " ")}`,
    staffId: actor.id,
    entityId: savedDoc.id,
    entityType: documentType,
    workstreamType: relatedWorkstreamType,
    status: "completed"
  });

  // 6. Add AuditLog
  addDemoAuditLog({
    organizationId: client.organizationId,
    userId: actor.id,
    action: "create_generated_document",
    entityType: "client",
    entityId: client.id,
    metadata: { documentType, docId: savedDoc.id }
  });

  // 7. Optionally create Task(s)
  if (createTask && taskData) {
    const tasks = Array.isArray(taskData) ? taskData : [taskData];
    tasks.forEach(td => {
      addDemoTask({
        organizationId: client.organizationId,
        siteId: client.siteId,
        clientId: client.id,
        assignedToId: actor.id,
        createdById: actor.id,
        title: td.title || `Follow up on ${title}`,
        description: td.description || "",
        dueDate: td.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: td.priority || "medium",
        status: "open",
        ...td
      });
    });
  }

  // 8. Optionally create Referral(s)
  if (createReferral && referralData) {
    const referrals = Array.isArray(referralData) ? referralData : [referralData];
    referrals.forEach(rd => {
      addDemoReferral({
        organizationId: client.organizationId,
        siteId: client.siteId,
        clientId: client.id,
        createdById: actor.id,
        referralType: rd.referralType || "other",
        agencyName: rd.agencyName || "TBD",
        referralDate: timestamp,
        status: "pending",
        ...rd
      });
    });
  }

  // 9. Optionally update Client status
  if (statusUpdate) {
    updateDemoClient(client.id, {
      status: statusUpdate
    });
  }

  // 10. Optionally create Supervisor Review
  if (supervisorReviewRequested) {
    addDemoSupervisorReview({
      organizationId: client.organizationId,
      siteId: client.siteId,
      clientId: client.id,
      supervisorId: "demo_ssa",
      workerId: actor.id,
      reviewType: documentType === "safety_plan" ? "safety_plan_review" : "case_note_review",
      comment: `Supervisor review requested for new ${documentType.replace("_", " ")}.`,
      actionRequired: true,
    });

    addDemoTimelineItem({
      id: `tl_rev_${Date.now()}`,
      clientId: client.id,
      type: "supervisor_review",
      date: timestamp,
      title: "Supervisor Review Requested",
      summary: `${title} submitted for supervisor review.`,
      staffId: actor.id,
      entityId: savedDoc.id,
      entityType: documentType,
      workstreamType: relatedWorkstreamType,
      status: "pending"
    });
  }

  // 11. Optionally create Client Need(s)
  if (createClientNeeds && clientNeedsData) {
    clientNeedsData.forEach(nd => {
      addDemoClientNeed({
        id: `need_${Date.now()}_${nd.needType}`,
        clientId: client.id,
        needType: nd.needType as any,
        priority: nd.priority || "medium",
        status: nd.status || "identified",
        recommendedNextAction: nd.recommendedNextAction || `Address ${String(nd.needType).replace("_", " ")} identified during assessment.`,
        relatedDocumentTypes: nd.relatedDocumentTypes || [],
        createdAt: timestamp,
        updatedAt: timestamp,
        sourceOfNeed: nd.sourceOfNeed || `Generated from ${documentType}`,
        dateIdentified: timestamp,
        identifiedBy: actor.id,
        relatedTaskIds: [],
        relatedReferralIds: []
      });
    });
  }

  return savedDoc;
};

export interface CaseNoteWorkflowInput {
  client: Client;
  actor: ServiceActor;
  noteData: Omit<CaseNote, "id" | "createdAt" | "updatedAt">;
  relatedWorkstreamType?: WorkstreamType;
  createTask?: boolean;
  taskData?: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>;
  supervisorReviewRequested?: boolean;
}

export const completeDemoCaseNoteWorkflow = (input: CaseNoteWorkflowInput): CaseNote => {
  const {
    client,
    actor,
    noteData,
    relatedWorkstreamType,
    createTask,
    taskData,
    supervisorReviewRequested
  } = input;

  const timestamp = new Date().toISOString();

  // 1. Add Case Note
  const savedNote = addDemoCaseNote({
    ...noteData,
    id: `note_${Date.now()}`,
    clientId: client.id,
    authorId: actor.id,
    authorName: `${actor.firstName} ${actor.lastName}`,
    organizationId: actor.organizationId,
    siteId: client.siteId,
    aiGenerated: true,
    supervisorReviewed: false,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  // 2. Update Workstream
  if (relatedWorkstreamType) {
    updateDemoWorkstream(client.id, relatedWorkstreamType, {
      latestAction: noteData.roughSummary || "Case note documented.",
      updatedAt: timestamp,
      status: "in_progress"
    });
  }

  // 3. Add Timeline Item
  addDemoTimelineItem({
    id: `tl_note_${Date.now()}`,
    clientId: client.id,
    type: "case_note",
    date: timestamp,
    title: `Case Note: ${noteData.category.replace("_", " ")}`,
    summary: noteData.roughSummary || "Interaction documented.",
    staffId: actor.id,
    entityId: savedNote.id,
    entityType: "caseNote",
    status: "completed",
    workstreamType: relatedWorkstreamType
  });

  // 4. Add Audit Log
  addDemoAuditLog({
    organizationId: actor.organizationId,
    siteId: client.siteId,
    userId: actor.id,
    action: "create_case_note",
    entityType: "caseNote",
    entityId: savedNote.id,
    metadata: { clientId: client.id }
  });

  // 5. Optionally create Task
  if (createTask && taskData) {
    addDemoTask({
      organizationId: actor.organizationId,
      siteId: client.siteId,
      clientId: client.id,
      assignedToId: actor.id,
      createdById: actor.id,
      title: taskData.title || `Follow up from case note`,
      description: taskData.description || "",
      dueDate: taskData.dueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: taskData.priority || "medium",
      status: "open",
      ...taskData
    });
  }

  // 6. Optionally create Supervisor Review
  if (supervisorReviewRequested) {
    addDemoSupervisorReview({
      organizationId: client.organizationId,
      siteId: client.siteId,
      clientId: client.id,
      supervisorId: "demo_ssa",
      workerId: actor.id,
      reviewType: "case_note_review",
      comment: "Supervisor review requested for case note.",
      actionRequired: true,
    });
  }

  return savedNote;
};

export const copyDemoDocumentToSmis = (
  clientId: string,
  docId: string,
  actor: ServiceActor
) => {
  const store = getDemoStore();
  const doc = store.generatedDocuments.find(d => d.id === docId);
  if (!doc) return;

  const updatedDoc = {
    ...doc,
    status: "copied_to_smis" as any,
    copiedToSmisAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  upsertDemoGeneratedDocument(updatedDoc);

  addDemoAuditLog({
    organizationId: actor.organizationId,
    userId: actor.id,
    action: "copy_for_smis",
    entityType: "generated_document",
    entityId: docId,
    metadata: { clientId }
  });

  return updatedDoc;
};

export const copyDemoCaseNoteToSmis = (clientId: string, noteId: string, actor: ServiceActor) => {
  addDemoAuditLog({
    organizationId: actor.organizationId,
    siteId: actor.siteIds[0],
    userId: actor.id,
    action: "copy_for_smis",
    entityType: "caseNote",
    entityId: noteId,
    metadata: { clientId }
  });

  // Update note if we had a field for it, but for now just audit log
  // Maybe we can update the updated at
};
