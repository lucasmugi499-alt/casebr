import { ClientNeedType, GeneratedDocument, GeneratedDocumentType } from "@/types";

const PLAN_MAP: Record<GeneratedDocumentType, { label: string; action: string; path: string }> = {
  intake_assessment: { label: "Intake Assessment", action: "Start Intake Assessment", path: "intake" },
  document_checklist: { label: "Document Checklist", action: "Start Document Checklist", path: "checklist" },
  housing_plan: { label: "Housing Plan", action: "Start Housing Plan", path: "housing" },
  safety_plan: { label: "Safety Plan", action: "Start Safety Plan", path: "safety" },
  service_plan: { label: "Service Plan", action: "Start Service Plan", path: "service" },
  discharge_transition_plan: { label: "Discharge / Transition Plan", action: "Start Discharge / Transition Plan", path: "discharge" },
  supervisor_summary: { label: "", action: "", path: "" }, case_summary: { label: "", action: "", path: "" }
};

export function getRequiredPlansForClient(caseworkState: any) { const needs = new Set<ClientNeedType>(caseworkState.clientNeeds.map((n: any) => n.needType)); const planTypes = new Set<GeneratedDocumentType>(["intake_assessment", "document_checklist", "service_plan"]); if (needs.has("housing_support")) planTypes.add("housing_plan"); if (needs.has("safety_planning")) planTypes.add("safety_plan"); if (["housed", "discharged", "transferred", "follow_up_support"].includes(caseworkState.client.status) || needs.has("discharge_transition_planning")) planTypes.add("discharge_transition_plan"); return [...planTypes].map((type) => { const doc = (caseworkState.generatedDocuments as GeneratedDocument[]).find((d) => d.type === type); let status: string = "missing"; if (doc?.status === "completed" || doc?.status === "copied_to_smis") status = "completed"; else if (doc?.status === "draft") status = "draft"; else if (doc?.status === "review_due" || (doc?.reviewDate && new Date(doc.reviewDate) < new Date())) status = "review_due"; return { type, label: PLAN_MAP[type].label, status, reasonRequired: `${PLAN_MAP[type].label} is required based on current client intake status and identified needs.`, relatedNeedType: type === "housing_plan" ? "housing_support" : type === "safety_plan" ? "safety_planning" : undefined, priority: ["housing_plan", "safety_plan"].includes(type) ? "high" : "medium", actionLabel: status === "completed" ? "Review Plan" : PLAN_MAP[type].action, actionUrl: `/clients/${caseworkState.client.id}/plans/${PLAN_MAP[type].path}/new` }; }); }
