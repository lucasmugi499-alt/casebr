export function generateSmartTaskRecommendations(caseworkState: any) { const out:any[]=[]; const add=(title:string,reason:string,priority="medium",relatedDocumentType?:string)=>out.push({ id:`rec-${caseworkState.client.id}-${out.length+1}`, clientId:caseworkState.client.id, title, reason, priority, dueDate:new Date(Date.now()+3*86400000).toISOString(), relatedDocumentType, source:"casework_orchestration", canDismiss:true, canAccept:true });
for (const plan of caseworkState.requiredPlans||[]) if (plan.status!=="completed") add(`Complete ${plan.label}`, `${plan.label} is currently ${plan.status}.`, plan.priority, plan.type);
if (!caseworkState.client.lastContactAt || new Date(caseworkState.client.lastContactAt).getTime() < Date.now()-7*86400000) add("Add case note", "No contact documented in the last 7 days.", "high");
return out;
}
