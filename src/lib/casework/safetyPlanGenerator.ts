import { Client } from "@/types";

export type SafetyPlanReason =
  | "client_requested"
  | "staff_identified"
  | "recent_incident"
  | "vulnerability"
  | "health_medical"
  | "mental_health"
  | "substance_use"
  | "placement_concern"
  | "review"
  | "other";

export interface SafetyPlanAnswers {
  // Step 1: Reason
  reason?: SafetyPlanReason | string;
  isUpdate?: string;
  clientInvolved?: string;
  clientAgreed?: string;
  supervisorReviewRequired?: string;

  // Step 2: Concerns
  clientConcerns?: string;
  avoidSituations?: string;
  immediateConcerns?: string;
  whatHelpsSafety?: string;

  // Step 3: Warning Signs
  warningSigns?: string;
  stressSituations?: string;
  overwhelmedIndicators?: string;
  staffWatchFor?: string;

  // Step 4: Coping & De-escalation
  copingStrategies?: string;
  helpfulSupports?: string;
  helpfulStaffApproaches?: string;
  approachesToAvoid?: string;
  preferredCommunication?: string;

  // Step 5: Supports & Contacts
  trustedSupports?: string;
  agenciesInvolved?: string;
  healthSupports?: string;
  staffConnectRequest?: string;
  emergencyContacts?: string;

  // Step 6: Staff Support Plan
  staffDistressSteps?: string;
  staffFirstSteps?: string;
  supervisorNotification?: string;
  specificCommunicationApproaches?: string;
  environmentalChanges?: string;
  staffFollowUpTasks?: string;

  // Step 7: Follow-Up
  nextAction?: string;
  responsible?: string;
  dueDate?: string;
  reviewDate?: string;
  createTask?: string;
  createReferral?: string;
  requestSupervisorReview?: string;

  // Step 8: Review (no extra fields)
}

const safe = (v?: string) => (v && v.trim() ? v.trim() : "Not documented.");

const yesNo = (v?: string) => {
  if (!v) return "Not documented.";
  const l = v.toLowerCase().trim();
  if (l === "yes" || l === "true" || l === "y") return "Yes";
  if (l === "no" || l === "false" || l === "n") return "No";
  return v;
};

const reasonLabel: Record<string, string> = {
  client_requested: "Client requested support",
  staff_identified: "Staff identified safety concern",
  recent_incident: "Recent conflict or incident",
  vulnerability: "Vulnerability concern",
  health_medical: "Health or medical concern",
  mental_health: "Mental health-related concern",
  substance_use: "Substance use-related concern",
  placement_concern: "Housing/shelter placement concern",
  review: "Review of existing plan",
  other: "Other",
};

export const generateSafetyPlanText = (
  client: Client,
  completedBy: string,
  siteName: string,
  answers: SafetyPlanAnswers
): string => {
  const today = new Date().toLocaleDateString("en-CA");
  const reason = reasonLabel[answers.reason ?? ""] ?? safe(answers.reason);

  return [
    `SAFETY PLAN`,
    ``,
    `Client: ${client.displayName}`,
    `Client Code: ${client.clientCode}`,
    `Date Completed: ${today}`,
    `Completed By: ${completedBy}`,
    `Shelter / Site: ${siteName}`,
    ``,
    `─────────────────────────────────────────`,
    `REASON FOR SAFETY PLAN`,
    `─────────────────────────────────────────`,
    `Primary reason: ${reason}`,
    `Type: ${answers.isUpdate === "yes" ? "Update / Review of existing plan" : "New safety plan"}`,
    `Client involved in development: ${yesNo(answers.clientInvolved)}`,
    `Client agreed to plan: ${yesNo(answers.clientAgreed)}`,
    `Supervisor review recommended: ${yesNo(answers.supervisorReviewRequired)}`,
    ``,
    `─────────────────────────────────────────`,
    `CLIENT-IDENTIFIED SAFETY CONCERNS`,
    `─────────────────────────────────────────`,
    `Client's identified concerns:`,
    safe(answers.clientConcerns),
    ``,
    `People, places, or situations to avoid:`,
    safe(answers.avoidSituations),
    ``,
    `What the client identifies would help them feel safer:`,
    safe(answers.whatHelpsSafety),
    ``,
    `─────────────────────────────────────────`,
    `WARNING SIGNS / TRIGGERS`,
    `─────────────────────────────────────────`,
    `Early warning signs identified:`,
    safe(answers.warningSigns),
    ``,
    `Situations increasing stress or conflict:`,
    safe(answers.stressSituations),
    ``,
    `Staff observations (per client shared info):`,
    safe(answers.staffWatchFor),
    ``,
    `─────────────────────────────────────────`,
    `COPING STRATEGIES AND DE-ESCALATION SUPPORTS`,
    `─────────────────────────────────────────`,
    `Client-identified coping strategies:`,
    safe(answers.copingStrategies),
    ``,
    `Helpful staff approaches:`,
    safe(answers.helpfulStaffApproaches),
    ``,
    `Approaches for staff to avoid:`,
    safe(answers.approachesToAvoid),
    ``,
    `Preferred communication: ${safe(answers.preferredCommunication)}`,
    ``,
    `─────────────────────────────────────────`,
    `SUPPORTS AND CONTACTS`,
    `─────────────────────────────────────────`,
    `Trusted supports: ${safe(answers.trustedSupports)}`,
    `Involved agencies: ${safe(answers.agenciesInvolved)}`,
    `Health / Mental Health supports: ${safe(answers.healthSupports)}`,
    `Emergency / Support contacts: ${safe(answers.emergencyContacts)}`,
    ``,
    `─────────────────────────────────────────`,
    `STAFF SUPPORT PLAN`,
    `─────────────────────────────────────────`,
    `Staff steps if client appears distressed or overwhelmed:`,
    safe(answers.staffDistressSteps),
    ``,
    `Immediate first steps for staff:`,
    safe(answers.staffFirstSteps),
    ``,
    `Specific safety or communication approaches:`,
    safe(answers.specificCommunicationApproaches),
    ``,
    `Criteria for supervisor notification:`,
    safe(answers.supervisorNotification),
    ``,
    `─────────────────────────────────────────`,
    `FOLLOW-UP ACTIONS`,
    `─────────────────────────────────────────`,
    `- Action: ${safe(answers.nextAction)}`,
    `- Responsible Person: ${safe(answers.responsible)}`,
    `- Due Date: ${safe(answers.dueDate)}`,
    `- Review Date: ${safe(answers.reviewDate)}`,
    ``,
    `─────────────────────────────────────────`,
    `CLIENT PARTICIPATION / AGREEMENT`,
    `─────────────────────────────────────────`,
    answers.clientAgreed === "yes" 
      ? "Client actively participated in the development of this plan and expressed agreement with the documented strategies and supports."
      : "Client participated in the discussion. Agreement status was not explicitly confirmed at this time.",
    ``,
    `─────────────────────────────────────────`,
    `SUPERVISOR REVIEW`,
    `─────────────────────────────────────────`,
    answers.supervisorReviewRequired === "yes" 
      ? "Supervisor review requested for this safety plan."
      : "Standard plan; supervisor review not explicitly requested at time of creation.",
    ``,
    `─────────────────────────────────────────`,
    `WORKER SUMMARY`,
    `─────────────────────────────────────────`,
    `Safety plan developed to address identified client needs and stabilize environment. Plan focuses on trauma-informed de-escalation, coping strategies, and clear staff support protocols. Review date set and follow-up actions assigned.`,
  ].join("\n");
};
