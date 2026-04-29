import { CaseNote, Client, ClientNeed, DocumentChecklist, DocumentationChecklist, GeneratedDocument, Referral, RiskFlag, SafetyPlan, SupervisorReview, Task, TimelineItem, Workstream } from "@/types";
import { calculateDocumentationStatus } from "./documentationStatusEngine";
import { calculateHousingReadiness } from "./housingReadinessEngine";
import { generateCaseworkerNudges } from "./nudgeEngine";
import { getRequiredPlansForClient } from "./planRecommendationEngine";
import { generateSmartTaskRecommendations } from "./smartTaskEngine";

export interface ClientCaseworkStateInput { client: Client; notes: CaseNote[]; tasks: Task[]; referrals: Referral[]; riskFlags: RiskFlag[]; safetyPlans: SafetyPlan[]; generatedDocuments: GeneratedDocument[]; clientNeeds: ClientNeed[]; workstreams: Workstream[]; documentationChecklist: DocumentationChecklist | null; documentChecklist: DocumentChecklist | null; supervisorReviews: SupervisorReview[]; timeline?: TimelineItem[]; }
export const buildClientCaseworkState = (input: ClientCaseworkStateInput) => { const requiredPlans = getRequiredPlansForClient(input); const documentationStatus = calculateDocumentationStatus(input); const housingReadiness = calculateHousingReadiness({ ...input, requiredPlans }); const smartTasks = generateSmartTaskRecommendations({ ...input, requiredPlans, housingReadiness }); const nextBestActions = smartTasks.slice(0, 5).map((t) => t.title); const activeNeeds = input.clientNeeds.filter((n) => !["completed", "closed"].includes(n.status)); const missingPlans = requiredPlans.filter((p) => ["missing", "draft", "review_due"].includes(p.status)); const completedPlans = requiredPlans.filter((p) => p.status === "completed"); const ssaNudges = generateCaseworkerNudges({ ...input, requiredPlans, smartTasks });
const priorityLevel = input.client.priority === "high" || missingPlans.some((p) => p.priority === "high") ? "high" : (input.tasks.some((t) => t.status === "overdue") ? "medium" : "low");
return { ...input, activeNeeds, requiredPlans, completedPlans, missingPlans, documentationStatus, housingReadiness, smartTasks, nextBestActions, ssaNudges, managerFlags: [{ type: "documentation_gaps", count: documentationStatus.items.filter((i) => i.required && i.status !== "completed").length }], timelineHighlights: input.timeline ?? [], priorityLevel, summary: `${input.client.displayName}: ${housingReadiness.level.replace("_", " ")} with ${missingPlans.length} required plans needing attention.` }; };


export function applyInitialAssessmentToClientFile(input: any) {
  const { client, intakeAnswers, actor, currentStore } = input;
  const updates:any = { needs: [], workstreams: [], requiredPlans: [], smartTasks: [], timelineItem: null, auditLog: null };
  const need = (t:string, action:string)=>updates.needs.push({ clientId: client.id, needType: t, status: "identified", priority: "high", sourceOfNeed: "initial_assessment", dateIdentified: new Date().toISOString(), identifiedBy: actor.id, recommendedNextAction: action, relatedDocumentTypes: [], relatedTaskIds: [], relatedReferralIds: [] });
  if (intakeAnswers?.priorityNeeds?.includes("housing_support")) { need("housing_support", "Start Housing Plan"); updates.requiredPlans.push("housing_plan"); updates.smartTasks.push("Complete Housing Plan"); }
  if (intakeAnswers?.priorityNeeds?.includes("safety_planning")) { need("safety_planning", "Start Safety Plan"); updates.requiredPlans.push("safety_plan"); updates.smartTasks.push("Complete Safety Plan"); }
  if (intakeAnswers?.priorityNeeds?.includes("income_support")) { need("income_benefits_support", "Confirm income/benefits status"); updates.smartTasks.push("Confirm income/benefits status"); }
  updates.requiredPlans.push("service_plan","document_checklist");
  updates.timelineItem = { id: `timeline-${Date.now()}`, clientId: client.id, type: "intake_assessment", date: new Date().toISOString(), title: "Initial Assessment completed", summary: "Assessment results were applied to the casework file.", staffId: actor.id, entityId: client.id, entityType: "client" };
  updates.auditLog = { id: `audit-${Date.now()}`, organizationId: client.organizationId, siteId: client.siteId, userId: actor.id, action: "initial_assessment_applied", entityType: "client", entityId: client.id, timestamp: new Date().toISOString(), metadata: { requiredPlans: updates.requiredPlans } };
  return updates;
}
