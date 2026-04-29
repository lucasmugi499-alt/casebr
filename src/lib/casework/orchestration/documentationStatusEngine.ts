export function calculateDocumentationStatus(caseworkState: any) { const planStatus = new Map(caseworkState.requiredPlans?.map((p: any) => [p.type, p])); const items = [
{ key: "intake", label: "Intake Assessment", plan: "intake_assessment", required: true },
{ key: "docs", label: "Document Checklist", plan: "document_checklist", required: true },
{ key: "housing", label: "Housing Plan", plan: "housing_plan", required: caseworkState.clientNeeds.some((n: any)=>n.needType==="housing_support") },
{ key: "safety", label: "Safety Plan", plan: "safety_plan", required: caseworkState.clientNeeds.some((n: any)=>n.needType==="safety_planning") },
{ key: "service", label: "Service Plan / Goals", plan: "service_plan", required: true },
].map((i)=>{ const p=planStatus.get(i.plan); return { key:i.key,label:i.label,status: i.required ? (p?.status ?? "missing") : "not_applicable", relatedDocumentId:undefined, actionLabel:p?.actionLabel ?? "Open", actionUrl:p?.actionUrl ?? `/clients/${caseworkState.client.id}`, required:i.required};});
const overallCompletionPercent = Math.round((items.filter((i:any)=>!i.required||i.status==="completed").length/items.length)*100);
return { overallCompletionPercent, items };
}
