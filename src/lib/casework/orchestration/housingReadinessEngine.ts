export function calculateHousingReadiness(caseworkState: any) { const checks = [
["Intake Assessment completed", caseworkState.requiredPlans?.find((p:any)=>p.type==="intake_assessment")?.status==="completed"],
["Housing Plan completed", caseworkState.requiredPlans?.find((p:any)=>p.type==="housing_plan")?.status==="completed"],
["Service Plan completed", caseworkState.requiredPlans?.find((p:any)=>p.type==="service_plan")?.status==="completed"],
["Document Checklist completed", caseworkState.requiredPlans?.find((p:any)=>p.type==="document_checklist")?.status==="completed"],
["Recent case note/contact", !!caseworkState.client.lastContactAt && new Date(caseworkState.client.lastContactAt).getTime() > Date.now()-7*86400000]
]; const completedItems = checks.filter(c=>c[1]).map(c=>c[0] as string); const missingItems = checks.filter(c=>!c[1]).map(c=>c[0] as string); const score = Math.round((completedItems.length/checks.length)*100); const level = score>=90?"housing_ready":score>=70?"mostly_ready":score>=40?"getting_ready":"not_ready"; return { score, level, completedItems, missingItems, blockers: missingItems.slice(0,3), recommendedNextActions: missingItems.map((m)=>`Complete: ${m}`)};
}
