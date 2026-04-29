import {
  AuditLog,
  CaseNote,
  Client,
  ClientNeed,
  DocumentationChecklist,
  DocumentChecklist,
  GeneratedDocument,
  Organization,
  Referral,
  ReferralType,
  RiskFlag,
  SafetyPlan,
  Site,
  SupervisorReview,
  Task,
  UserProfile,
  Workstream,
} from "@/types";

const now = new Date();
const isoDaysAgo = (daysAgo: number, hour = 14) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};
const isoDaysFromNow = (daysFromNow: number, hour = 16) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const demoOrganization: Organization = { id: "org_casebridge_demo", name: "CaseBridge Demo Shelter Network", status: "active", settings: { allowAI: true, allowVoiceNotes: true, dataRetentionMonths: 24, requireSupervisorReviewForHighRisk: true, clientIdentifierMode: "client_code" }, createdAt: isoDaysAgo(540), updatedAt: isoDaysAgo(1) };

export const demoSites: Site[] = [
  { id: "site_downtown", organizationId: demoOrganization.id, name: "Downtown Shelter", address: "125 Main St, Metro City", type: "shelter", status: "active", createdAt: isoDaysAgo(510), updatedAt: isoDaysAgo(2) },
  { id: "site_east", organizationId: demoOrganization.id, name: "East Site", address: "480 East Ave, Metro City", type: "outreach_hub", status: "active", createdAt: isoDaysAgo(430), updatedAt: isoDaysAgo(3) },
];

export const demoUsers: UserProfile[] = [
  { id: "demo_admin", organizationId: demoOrganization.id, siteIds: ["site_downtown", "site_east"], firstName: "Demo", lastName: "Admin", email: "admin@demo.local", role: "admin", title: "System Administrator", status: "active", createdAt: isoDaysAgo(300), updatedAt: isoDaysAgo(1) },
  { id: "demo_manager", organizationId: demoOrganization.id, siteIds: ["site_downtown", "site_east"], firstName: "Demo", lastName: "Manager", email: "manager@demo.local", role: "manager", title: "Program Manager", status: "active", createdAt: isoDaysAgo(300), updatedAt: isoDaysAgo(1) },
  { id: "demo_ssa", organizationId: demoOrganization.id, siteIds: ["site_downtown", "site_east"], firstName: "Demo", lastName: "Supervisor", email: "ssa@demo.local", role: "ssa", title: "SSA / Supervisor", status: "active", createdAt: isoDaysAgo(300), updatedAt: isoDaysAgo(1) },
  { id: "demo_caseworker", organizationId: demoOrganization.id, siteIds: ["site_downtown"], firstName: "Demo", lastName: "Caseworker", email: "caseworker@demo.local", role: "caseworker", title: "Shelter Caseworker", status: "active", createdAt: isoDaysAgo(300), updatedAt: isoDaysAgo(1) },
  { id: "user_sarah", organizationId: demoOrganization.id, siteIds: ["site_downtown"], firstName: "Sarah", lastName: "Jenkins", email: "sarah.jenkins@demo.local", role: "caseworker", title: "Housing Caseworker", status: "active", createdAt: isoDaysAgo(270), updatedAt: isoDaysAgo(3) },
  { id: "user_mike", organizationId: demoOrganization.id, siteIds: ["site_downtown", "site_east"], firstName: "Mike", lastName: "Chen", email: "mike.chen@demo.local", role: "caseworker", title: "Outreach Caseworker", status: "active", createdAt: isoDaysAgo(240), updatedAt: isoDaysAgo(2) },
  { id: "user_aisha", organizationId: demoOrganization.id, siteIds: ["site_east"], firstName: "Aisha", lastName: "Patel", email: "aisha.patel@demo.local", role: "ssa", title: "Site Supervisor", status: "active", createdAt: isoDaysAgo(220), updatedAt: isoDaysAgo(1) },
  { id: "user_daniel", organizationId: demoOrganization.id, siteIds: ["site_downtown"], firstName: "Daniel", lastName: "Roberts", email: "daniel.roberts@demo.local", role: "manager", title: "Regional Manager", status: "active", createdAt: isoDaysAgo(350), updatedAt: isoDaysAgo(1) },
];

const clientSeeds: Array<Pick<Client, "id" | "siteId" | "displayName" | "clientCode" | "assignedWorkerIds" | "status" | "priority" | "currentGoal"> & { lastContactDays: number; followUpOffset: number }> = [
  { id: "client_1001", displayName: "Jordan A.", clientCode: "CB-1001", siteId: "site_downtown", assignedWorkerIds: ["demo_caseworker"], status: "active", priority: "high", currentGoal: "Complete housing application and obtain ID replacement.", lastContactDays: 1, followUpOffset: 0 },
  { id: "client_1002", displayName: "Maria L.", clientCode: "CB-1002", siteId: "site_downtown", assignedWorkerIds: ["demo_caseworker", "user_sarah"], status: "follow_up_needed", priority: "high", currentGoal: "Reconnect with income support worker after benefits interruption.", lastContactDays: 8, followUpOffset: -1 },
  { id: "client_1003", displayName: "Trevor N.", clientCode: "CB-1003", siteId: "site_east", assignedWorkerIds: ["user_mike"], status: "intake", priority: "medium", currentGoal: "Stabilize shelter placement and schedule health intake.", lastContactDays: 2, followUpOffset: 2 },
  { id: "client_1004", displayName: "Ashley P.", clientCode: "CB-1004", siteId: "site_downtown", assignedWorkerIds: ["demo_caseworker"], status: "active", priority: "medium", currentGoal: "Submit supportive housing documents and landlord references.", lastContactDays: 4, followUpOffset: 1 },
  { id: "client_1005", displayName: "Samuel R.", clientCode: "CB-1005", siteId: "site_east", assignedWorkerIds: ["user_mike", "demo_ssa"], status: "active", priority: "high", currentGoal: "Maintain medication plan and weekly clinical check-ins.", lastContactDays: 6, followUpOffset: 0 },
  { id: "client_1006", displayName: "Nadia K.", clientCode: "CB-1006", siteId: "site_downtown", assignedWorkerIds: ["user_sarah"], status: "housed", priority: "low", currentGoal: "Complete 30-day housing stabilization follow-up.", lastContactDays: 3, followUpOffset: 7 },
  { id: "client_1007", displayName: "Elias T.", clientCode: "CB-1007", siteId: "site_east", assignedWorkerIds: ["user_mike"], status: "discharged", priority: "low", currentGoal: "Closed - exited to family reunification.", lastContactDays: 20, followUpOffset: 30 },
  { id: "client_1008", displayName: "Patricia B.", clientCode: "CB-1008", siteId: "site_downtown", assignedWorkerIds: ["demo_caseworker"], status: "inactive", priority: "medium", currentGoal: "Re-engagement outreach after missed appointments.", lastContactDays: 16, followUpOffset: -5 },
  { id: "client_1009", displayName: "Leo D.", clientCode: "CB-1009", siteId: "site_east", assignedWorkerIds: ["demo_caseworker", "user_mike"], status: "active", priority: "high", currentGoal: "Address legal barriers and secure employment readiness referral.", lastContactDays: 9, followUpOffset: -2 },
  { id: "client_1010", displayName: "Renee S.", clientCode: "CB-1010", siteId: "site_downtown", assignedWorkerIds: ["user_sarah"], status: "follow_up_needed", priority: "medium", currentGoal: "Complete outstanding documentation for health coverage.", lastContactDays: 10, followUpOffset: 0 },
  { id: "client_1011", displayName: "Oscar H.", clientCode: "CB-1011", siteId: "site_east", assignedWorkerIds: ["demo_caseworker"], status: "intake", priority: "medium", currentGoal: "Develop first 14-day stabilization and safety plan.", lastContactDays: 1, followUpOffset: 3 },
  { id: "client_1012", displayName: "Kim W.", clientCode: "CB-1012", siteId: "site_downtown", assignedWorkerIds: ["demo_caseworker", "demo_ssa"], status: "active", priority: "high", currentGoal: "Reduce crisis episodes and maintain daily outreach contact.", lastContactDays: 0, followUpOffset: 0 },
  { id: "client_1013", displayName: "Marcus V.", clientCode: "CB-1013", siteId: "site_downtown", assignedWorkerIds: [], status: "intake", priority: "high", currentGoal: "Pending initial assessment and worker assignment.", lastContactDays: 0, followUpOffset: 2 },
  { id: "client_1014", displayName: "Elena G.", clientCode: "CB-1014", siteId: "site_east", assignedWorkerIds: [], status: "intake", priority: "medium", currentGoal: "Newly arrived, needs intake completion.", lastContactDays: 0, followUpOffset: 1 },
];

export const demoClients: Client[] = clientSeeds.map((seed, index) => ({
  id: seed.id,
  organizationId: demoOrganization.id,
  siteId: seed.siteId,
  displayName: seed.displayName,
  clientCode: seed.clientCode,
  assignedWorkerIds: [...seed.assignedWorkerIds],
  status: seed.status,
  priority: seed.priority,
  currentGoal: seed.currentGoal,
  lastContactAt: isoDaysAgo(seed.lastContactDays),
  nextFollowUpAt: isoDaysFromNow(seed.followUpOffset),
  createdAt: isoDaysAgo(160 - index * 4),
  updatedAt: isoDaysAgo(Math.max(0, seed.lastContactDays - 1)),
  createdById: "demo_ssa",
}));

export const demoCaseNotes: CaseNote[] = Array.from({ length: 20 }, (_, i) => {
  const client = demoClients[i % demoClients.length];
  const categories: CaseNote["category"][] = ["housing", "income_support", "mental_health", "medical_health", "system_navigation"];
  const contactTypes: CaseNote["contactType"][] = ["in_person", "phone", "outreach", "referral_support", "informal_check_in"];
  return { id: `note_${i + 1}`, organizationId: demoOrganization.id, siteId: client.siteId, clientId: client.id, authorId: ["demo_caseworker", "user_sarah", "user_mike"][i % 3], contactDate: isoDaysAgo((i % 11) + 1, 10 + (i % 6)), contactType: contactTypes[i % contactTypes.length], category: categories[i % categories.length], location: i % 2 === 0 ? "On-site office" : "Community outreach", roughSummary: `Client check-in covering ${categories[i % categories.length].replace("_", " ")} needs and next actions.`, actionsTaken: "Reviewed current plan, documented barriers, and confirmed next contact.", referralsMade: i % 4 === 0 ? "Housing Navigation Program" : "", followUpRequired: i % 3 !== 0, riskSafetyConcerns: i % 5 === 0 ? "Client reported anxiety related to shelter transition." : "", finalNote: "Client reported current barriers and identified practical next steps. Staff confirmed follow-up actions and support options.", aiGenerated: i % 2 === 0, aiActionUsed: i % 2 === 0 ? "Generate SMIS-style note" : undefined, supervisorReviewed: i % 6 === 0, createdAt: isoDaysAgo((i % 12) + 1), updatedAt: isoDaysAgo(i % 10) };
});

export const demoTasks: Task[] = Array.from({ length: 20 }, (_, i) => {
  const client = demoClients[i % demoClients.length];
  const statuses: Task["status"][] = ["open", "in_progress", "completed", "overdue", "open"];
  const priorities: Task["priority"][] = ["high", "medium", "low", "high", "medium"];
  const status = statuses[i % statuses.length];
  const dueOffset = i % 5 === 0 ? 0 : i % 4 === 0 ? -2 : i % 3 === 0 ? -1 : i % 2 === 0 ? 1 : 3;
  return { id: `task_${i + 1}`, organizationId: demoOrganization.id, siteId: client.siteId, clientId: client.id, assignedToId: client.assignedWorkerIds[0], createdById: "demo_ssa", title: i % 2 === 0 ? "Follow up on referral response" : "Client check-in and documentation", description: "Complete scheduled casework action and update client timeline.", dueDate: isoDaysFromNow(dueOffset, 17), priority: priorities[i % priorities.length], status, completedAt: status === "completed" ? isoDaysAgo(1) : undefined, createdAt: isoDaysAgo(15 + i), updatedAt: isoDaysAgo(Math.max(0, dueOffset < 0 ? 1 : 0)) };
});

export const demoReferrals: Referral[] = Array.from({ length: 15 }, (_, i) => {
  const client = demoClients[i % demoClients.length];
  const types: ReferralType[] = ["housing", "income", "other", "mental_health", "substance_use", "medical", "legal", "employment"];
  const statuses: Referral["status"][] = ["pending", "completed", "no_response", "pending", "declined"];
  return { id: `referral_${i + 1}`, organizationId: demoOrganization.id, siteId: client.siteId, clientId: client.id, createdById: client.assignedWorkerIds[0], referralType: types[i % types.length], agencyName: ["Metro Housing Access", "City Income Desk", "ID Clinic", "Community Health Collective"][i % 4], contactPerson: ["J. Brooks", "R. Gomez", "S. Turner", "L. Shah"][i % 4], contactInfo: "demo-agency@local.org", referralDate: isoDaysAgo((i % 20) + 1), status: statuses[i % statuses.length], followUpDate: isoDaysFromNow((i % 5) - 1), outcome: statuses[i % statuses.length] === "completed" ? "Connected to service intake." : undefined, createdAt: isoDaysAgo((i % 20) + 1), updatedAt: isoDaysAgo(i % 8) };
});

export const demoRiskFlags: RiskFlag[] = [
  { id: "risk_1", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1002", createdById: "demo_caseworker", category: "housing instability", severity: "high", description: "Missed two housing follow-up appointments.", active: true, supervisorReviewRequired: true, createdAt: isoDaysAgo(4), updatedAt: isoDaysAgo(2) },
  { id: "risk_2", organizationId: demoOrganization.id, siteId: "site_east", clientId: "client_1005", createdById: "user_mike", category: "behavioral health", severity: "medium", description: "Increased distress reported during outreach.", active: true, supervisorReviewRequired: true, createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(1) },
  { id: "risk_3", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1012", createdById: "demo_caseworker", category: "safety concern", severity: "high", description: "Escalating conflict with peer at shelter.", active: true, supervisorReviewRequired: true, createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(0) },
  { id: "risk_4", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1004", createdById: "user_sarah", category: "medical adherence", severity: "medium", description: "Difficulty attending appointments.", active: true, supervisorReviewRequired: false, createdAt: isoDaysAgo(5), updatedAt: isoDaysAgo(3) },
  { id: "risk_5", organizationId: demoOrganization.id, siteId: "site_east", clientId: "client_1009", createdById: "demo_ssa", category: "legal risk", severity: "high", description: "Upcoming legal date requires coordinated planning.", active: true, supervisorReviewRequired: true, createdAt: isoDaysAgo(6), updatedAt: isoDaysAgo(2) },
  { id: "risk_6", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1006", createdById: "user_sarah", category: "transition support", severity: "low", description: "Needs extra housing stabilization contact.", active: false, supervisorReviewRequired: false, resolvedAt: isoDaysAgo(7), createdAt: isoDaysAgo(15), updatedAt: isoDaysAgo(7) },
  { id: "risk_7", organizationId: demoOrganization.id, siteId: "site_east", clientId: "client_1003", createdById: "user_mike", category: "substance use", severity: "medium", description: "Client requested voluntary support resources.", active: false, supervisorReviewRequired: false, resolvedAt: isoDaysAgo(5), createdAt: isoDaysAgo(11), updatedAt: isoDaysAgo(5) },
  { id: "risk_8", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1008", createdById: "demo_caseworker", category: "no contact", severity: "low", description: "No successful check-in for over two weeks.", active: true, supervisorReviewRequired: false, createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(1) },
];

export const demoSafetyPlans: SafetyPlan[] = [
  { id: "safety_1", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1002", createdById: "demo_caseworker", concernSummary: "Client reports elevated stress and disrupted sleep.", triggers: "Uncertain housing outcomes and missed benefit appointment.", copingStrategies: "Scheduled breathing exercise, daily check-in with peer support worker.", supports: "SSA check-in twice weekly and crisis line on request.", staffActions: "Coordinate housing navigator follow-up and monitor missed appointments.", emergencySteps: "Contact on-call supervisor and emergency supports if escalation occurs.", clientAgreed: true, reviewDate: isoDaysFromNow(2), status: "review_due", createdAt: isoDaysAgo(8), updatedAt: isoDaysAgo(2) },
  { id: "safety_2", organizationId: demoOrganization.id, siteId: "site_east", clientId: "client_1005", createdById: "demo_ssa", concernSummary: "Client managing anxiety symptoms while in congregate setting.", triggers: "Crowded intake periods and sleep disruptions.", copingStrategies: "Quiet room access and stepped support check-ins.", supports: "Clinical referral and weekly outreach touchpoint.", staffActions: "Track triggers and reinforce coping plan during outreach.", emergencySteps: "Escalate to clinical partner if safety concerns increase.", clientAgreed: true, reviewDate: isoDaysFromNow(7), status: "active", createdAt: isoDaysAgo(12), updatedAt: isoDaysAgo(1) },
  { id: "safety_3", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1012", createdById: "demo_caseworker", concernSummary: "Conflict de-escalation support needed.", triggers: "Interpersonal conflict and crowded dorm area.", copingStrategies: "Time-out protocol and staff-mediated dialogue.", supports: "Daily supervisor check-in for one week.", staffActions: "Document incidents and complete supervisory review.", emergencySteps: "Immediate supervisor engagement if threats occur.", clientAgreed: true, reviewDate: isoDaysFromNow(1), status: "active", createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(0) },
  { id: "safety_4", organizationId: demoOrganization.id, siteId: "site_east", clientId: "client_1009", createdById: "user_mike", concernSummary: "Legal stress contributing to instability.", triggers: "Upcoming hearing reminders.", copingStrategies: "Accompaniment planning and coaching calls.", supports: "Legal clinic and SSA consult.", staffActions: "Coordinate legal referral and transportation support.", emergencySteps: "Engage crisis intervention if client reports acute distress.", clientAgreed: true, reviewDate: isoDaysFromNow(5), status: "review_due", createdAt: isoDaysAgo(6), updatedAt: isoDaysAgo(1) },
  { id: "safety_5", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1006", createdById: "user_sarah", concernSummary: "Post-housing transition supports completed.", triggers: "Initial lease-up adjustment period.", copingStrategies: "Weekly check-ins and landlord liaison.", supports: "Community tenancy support worker.", staffActions: "Close plan and transition to standard follow-up.", emergencySteps: "Re-open plan if instability returns.", clientAgreed: true, reviewDate: isoDaysAgo(10), status: "closed", createdAt: isoDaysAgo(45), updatedAt: isoDaysAgo(10) },
];

export const demoSupervisorReviews: SupervisorReview[] = [
  { id: "review_1", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1002", riskFlagId: "risk_1", supervisorId: "demo_ssa", workerId: "demo_caseworker", reviewType: "risk_review", comment: "Assessed housing follow-up gaps. Caseworker to reconnect with agency and document barrier resolution.", actionRequired: true, actionDueDate: isoDaysFromNow(2), createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(1) },
  { id: "review_2", organizationId: demoOrganization.id, siteId: "site_east", clientId: "client_1005", riskFlagId: "risk_2", supervisorId: "user_aisha", workerId: "user_mike", reviewType: "risk_review", comment: "Distress noted. Confirmed outreach plan is sufficient. No further action needed at this time.", actionRequired: false, createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2) },
  { id: "review_3", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1012", riskFlagId: "risk_3", supervisorId: "demo_ssa", workerId: "demo_caseworker", reviewType: "safety_plan_review", comment: "De-escalation protocol reviewed. Ensure peer mediator is involved in next contact.", actionRequired: true, actionDueDate: isoDaysFromNow(1), createdAt: isoDaysAgo(1), updatedAt: isoDaysAgo(1) },
  { id: "review_4", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1001", caseNoteId: "note_1", supervisorId: "demo_ssa", workerId: "demo_caseworker", reviewType: "case_note_review", comment: "Documentation of housing referral is excellent. Please confirm if ID replacement form was also signed.", actionRequired: true, actionDueDate: isoDaysFromNow(3), createdAt: isoDaysAgo(5), updatedAt: isoDaysAgo(5) },
  { id: "review_5", organizationId: demoOrganization.id, siteId: "site_east", clientId: "client_1009", riskFlagId: "risk_5", supervisorId: "user_aisha", workerId: "user_mike", reviewType: "client_progress", comment: "Legal coordination in progress. Caseworker doing a good job navigating complex barrier.", actionRequired: false, createdAt: isoDaysAgo(4), updatedAt: isoDaysAgo(4) },
  { id: "review_6", organizationId: demoOrganization.id, siteId: "site_downtown", clientId: "client_1013", supervisorId: "demo_ssa", reviewType: "assignment_note", comment: "New intake client. Assigned based on current downtown workload balance.", actionRequired: false, createdAt: isoDaysAgo(0), updatedAt: isoDaysAgo(0) },
];

export const demoWorkstreams: Workstream[] = [
  { id: "ws_1001_housing", clientId: "client_1001", type: "housing", status: "waiting_on_agency", latestAction: "Housing application submitted to Metro Housing Access.", nextAction: "Follow up with housing worker.", dueDate: isoDaysFromNow(2), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_1"], linkedTaskIds: ["task_1"], linkedReferralIds: ["referral_1"], priority: "high", updatedAt: isoDaysAgo(1) },
  { id: "ws_1001_income", clientId: "client_1001", type: "income_benefits", status: "in_progress", latestAction: "Client supported with CRA account setup.", nextAction: "Obtain Notice of Assessment.", dueDate: isoDaysFromNow(4), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_2"], linkedTaskIds: ["task_2"], linkedReferralIds: [], priority: "medium", updatedAt: isoDaysAgo(1) },
  { id: "ws_1001_id", clientId: "client_1001", type: "identification_documents", status: "blocked", latestAction: "Client reported lost ID.", nextAction: "Complete birth certificate replacement form.", dueDate: isoDaysFromNow(5), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_3"], linkedTaskIds: ["task_3"], linkedReferralIds: ["referral_3"], priority: "high", updatedAt: isoDaysAgo(2) },
  { id: "ws_1002_housing", clientId: "client_1002", type: "housing", status: "in_progress", latestAction: "Referred to supportive housing navigator.", nextAction: "Confirm intake date with agency.", dueDate: isoDaysFromNow(1), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_4"], linkedTaskIds: ["task_4"], linkedReferralIds: ["referral_4"], priority: "high", updatedAt: isoDaysAgo(1) },
  { id: "ws_1002_safety", clientId: "client_1002", type: "safety", status: "in_progress", latestAction: "Safety planning session completed.", nextAction: "Review safety plan.", dueDate: isoDaysFromNow(2), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_5"], linkedTaskIds: ["task_5"], linkedReferralIds: [], priority: "high", updatedAt: isoDaysAgo(1) },
  { id: "ws_1004_housing", clientId: "client_1004", type: "housing", status: "waiting_on_client", latestAction: "Requested landlord references from client.", nextAction: "Collect references and upload copies.", dueDate: isoDaysFromNow(3), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_6"], linkedTaskIds: ["task_6"], linkedReferralIds: ["referral_6"], priority: "medium", updatedAt: isoDaysAgo(2) },
  { id: "ws_1008_housing", clientId: "client_1008", type: "housing", status: "paused", latestAction: "Client missed two appointments.", nextAction: "Re-engagement outreach call.", dueDate: isoDaysFromNow(0), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_8"], linkedTaskIds: ["task_8"], linkedReferralIds: [], priority: "medium", updatedAt: isoDaysAgo(1) },
  { id: "ws_1011_intake", clientId: "client_1011", type: "other", status: "not_started", latestAction: "Client assigned yesterday.", nextAction: "Begin intake and service planning.", dueDate: isoDaysFromNow(1), assignedWorkerId: "demo_caseworker", linkedNoteIds: [], linkedTaskIds: ["task_11"], linkedReferralIds: [], priority: "medium", updatedAt: isoDaysAgo(0) },
  { id: "ws_1012_safety", clientId: "client_1012", type: "safety", status: "waiting_on_agency", latestAction: "Escalation support requested from clinical partner.", nextAction: "Confirm partner response and schedule check-in.", dueDate: isoDaysFromNow(1), assignedWorkerId: "demo_caseworker", linkedNoteIds: ["note_12"], linkedTaskIds: ["task_12"], linkedReferralIds: ["referral_12"], priority: "high", updatedAt: isoDaysAgo(0) },
];

export const demoClientNeeds: ClientNeed[] = [
  { id: "need_1001_housing", clientId: "client_1001", needType: "housing_support", status: "in_progress", priority: "high", sourceOfNeed: "Initial intake assessment", dateIdentified: isoDaysAgo(12), identifiedBy: "demo_ssa", linkedWorkstreamId: "ws_1001_housing", recommendedNextAction: "Complete housing plan assessment and submit follow-up.", relatedDocumentTypes: ["housing_plan"], relatedTaskIds: ["task_1"], relatedReferralIds: ["referral_1"] },
  { id: "need_1001_docs", clientId: "client_1001", needType: "identification_documents_support", status: "blocked", priority: "high", sourceOfNeed: "Case note follow-up", dateIdentified: isoDaysAgo(8), identifiedBy: "demo_caseworker", linkedWorkstreamId: "ws_1001_id", recommendedNextAction: "Review missing document checklist with client.", relatedDocumentTypes: ["document_checklist"], relatedTaskIds: ["task_3"], relatedReferralIds: ["referral_3"] },
  { id: "need_1002_safety", clientId: "client_1002", needType: "safety_planning", status: "in_progress", priority: "high", sourceOfNeed: "Active risk flag", dateIdentified: isoDaysAgo(5), identifiedBy: "demo_caseworker", linkedWorkstreamId: "ws_1002_safety", recommendedNextAction: "Complete safety plan review by due date.", relatedDocumentTypes: ["safety_plan"], relatedTaskIds: ["task_5"], relatedReferralIds: [] },
  { id: "need_1004_housing", clientId: "client_1004", needType: "housing_support", status: "waiting_on_client", priority: "medium", sourceOfNeed: "Housing support referral", dateIdentified: isoDaysAgo(9), identifiedBy: "user_sarah", linkedWorkstreamId: "ws_1004_housing", recommendedNextAction: "Collect required landlord references.", relatedDocumentTypes: ["housing_plan"], relatedTaskIds: ["task_6"], relatedReferralIds: ["referral_6"] },
  { id: "need_1011_intake", clientId: "client_1011", needType: "income_benefits_support", status: "identified", priority: "medium", sourceOfNeed: "Intake pending", dateIdentified: isoDaysAgo(1), identifiedBy: "demo_ssa", linkedWorkstreamId: "ws_1011_intake", recommendedNextAction: "Start intake assessment and income screening.", relatedDocumentTypes: ["intake_assessment", "service_plan"], relatedTaskIds: ["task_11"], relatedReferralIds: [] },
  { id: "need_1012_housing", clientId: "client_1012", needType: "housing_support", status: "waiting_on_agency", priority: "high", sourceOfNeed: "Crisis stabilization meeting", dateIdentified: isoDaysAgo(4), identifiedBy: "demo_caseworker", linkedWorkstreamId: "ws_1012_safety", recommendedNextAction: "Coordinate with clinical and housing supports.", relatedDocumentTypes: ["housing_plan", "safety_plan"], relatedTaskIds: ["task_12"], relatedReferralIds: ["referral_12"] },
  { id: "need_1004_discharge", clientId: "client_1004", needType: "discharge_transition_planning", status: "identified", priority: "high", sourceOfNeed: "Housed referral accepted", dateIdentified: isoDaysAgo(2), identifiedBy: "demo_caseworker", recommendedNextAction: "Start discharge and transition support plan.", relatedDocumentTypes: ["discharge_transition_plan"], relatedTaskIds: [], relatedReferralIds: [] },
  { id: "need_1009_discharge", clientId: "client_1009", needType: "discharge_transition_planning", status: "identified", priority: "medium", sourceOfNeed: "Legal resolution pending", dateIdentified: isoDaysAgo(3), identifiedBy: "user_mike", recommendedNextAction: "Begin transition planning for post-legal discharge.", relatedDocumentTypes: ["discharge_transition_plan"], relatedTaskIds: [], relatedReferralIds: [] },
];

export const demoDocumentationChecklists: DocumentationChecklist[] = demoClients.map((client, index) => ({
  clientId: client.id,
  intakeCompleted: index % 3 !== 0,
  consentCompleted: index % 4 !== 0,
  privacyExplained: true,
  servicePlanStarted: index % 2 === 0,
  servicePlanCompleted: index % 4 === 0,
  housingPlanStarted: index % 3 === 0,
  housingPlanCompleted: index % 5 === 0,
  safetyScreeningCompleted: index % 5 !== 0,
  safetyPlanCompleted: index % 6 === 0,
  idStatusDocumented: index % 3 !== 1,
  incomeStatusDocumented: index % 4 !== 1,
  emergencyContactDocumented: index % 5 !== 2,
  referralsDocumented: index % 2 === 0,
  dischargeTransitionPlanDocumented: client.status === "discharged",
  updatedAt: isoDaysAgo(index % 6),
}));

export const demoDocumentChecklists: DocumentChecklist[] = demoClients.map((client, index) => ({
  clientId: client.id,
  governmentId: index % 2 === 0 ? "missing" : "complete",
  healthCard: index % 3 === 0 ? "requested" : "complete",
  sin: index % 4 === 0 ? "missing" : "complete",
  proofOfIncome: index % 5 === 0 ? "requested" : "complete",
  noticeOfAssessment: index % 2 === 0 ? "missing" : "requested",
  housingDocuments: index % 3 === 0 ? "requested" : "complete",
  medicalDocuments: "not_applicable",
  legalDocuments: index % 6 === 0 ? "requested" : "not_applicable",
  other: "not_applicable",
  updatedAt: isoDaysAgo(index % 4),
}));

export const demoGeneratedDocuments: GeneratedDocument[] = [
  {
    id: "doc_housing_1002",
    clientId: "client_1002",
    organizationId: demoOrganization.id,
    siteId: "site_downtown",
    type: "housing_plan",
    title: "Housing Plan - Maria L.",
    status: "review_due",
    generatedText: "HOUSING PLAN\n\nClient: Maria L.\nClient Code: CB-1002\nDate Completed: Not documented.\nCompleted By: Demo Caseworker\nShelter/Site: Downtown Shelter\n\nCurrent Housing Goal:\nSecure supportive housing placement with agency support.\n\nCurrent Housing Situation:\nCurrently staying in shelter; stabilization supports in progress.\n\nIncome and Affordability:\nIncome information is partially documented and follow-up is required.\n\nIdentification and Required Documents:\nSome documents are pending replacement.\n\nHousing Applications / Referrals:\nSupportive housing referral submitted and pending response.\n\nBarriers to Housing:\nIncome interruption and documentation delays.\n\nStrengths and Supports:\nClient is engaged and willing to work with staff.\n\nAction Plan:\n- Action: Follow up with housing agency.\n- Responsible Person: Caseworker\n- Due Date: Not documented.\n- Follow-Up Date: Not documented.\n\nClient Agreement / Participation:\nClient participated in planning discussion.\n\nNext Review Date:\nNot documented.\n\nWorker Summary:\nHousing supports are active and follow-up is required to reduce delays.",
    sourceAnswers: { draft: true },
    createdById: "demo_caseworker",
    createdAt: isoDaysAgo(5),
    updatedAt: isoDaysAgo(2),
    reviewDate: isoDaysFromNow(3),
  },
];

export const demoAuditLogs: AuditLog[] = Array.from({ length: 15 }, (_, i) => ({ id: `audit_${i + 1}`, organizationId: demoOrganization.id, siteId: i % 2 === 0 ? "site_downtown" : "site_east", userId: ["demo_caseworker", "demo_ssa", "demo_manager", "demo_admin"][i % 4], action: ["create_case_note", "create_task", "create_referral", "review_risk_flag", "update_client"][i % 5], entityType: ["caseNote", "task", "referral", "riskFlag", "client"][i % 5], entityId: [demoCaseNotes[0].id, demoTasks[0].id, demoReferrals[0].id, demoRiskFlags[0].id, demoClients[0].id][i % 5], timestamp: isoDaysAgo(i % 9, 9 + (i % 8)), metadata: { source: "demo", index: i + 1 } }));

export const demoOutcomes = [
  { month: "2026-01", intakes: 12, housed: 4, discharged: 2, active: 38 },
  { month: "2026-02", intakes: 14, housed: 5, discharged: 3, active: 41 },
  { month: "2026-03", intakes: 16, housed: 6, discharged: 2, active: 45 },
  { month: "2026-04", intakes: 18, housed: 8, discharged: 4, active: 49 },
];
