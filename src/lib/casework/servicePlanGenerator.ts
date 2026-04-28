import { Client } from "@/types";

export interface ActionStep {
  category: string;
  action: string;
  responsible: string;
  dueDate: string;
  followUpDate: string;
  priority: "low" | "medium" | "high";
  status: string;
}

export interface ServicePlanAnswers {
  // Step 1: Priorities and Goals
  priorities?: string;
  primaryGoal?: string;
  secondaryGoals?: string;
  supportFirst?: string;
  clientParticipated?: string;
  clientAgreed?: string;

  // Step 2: Current Needs
  identifiedNeeds?: string[];
  urgentNeeds?: string;
  ongoingNeeds?: string;
  needsAddressed?: string;
  addNewNeeds?: string;

  // Step 3: Strengths and Supports
  strengths?: string;
  pastSuccess?: string;
  communitySupports?: string;
  involvedAgencies?: string;
  copingSkills?: string;
  motivation?: string;

  // Step 4: Barriers and Challenges
  barriers?: string[];
  mainChallenge?: string;
  systemBarriers?: string;
  barrierSupport?: string;

  // Step 5: Action Steps
  actionSteps?: ActionStep[];

  // Step 6: Referrals and Supports
  referralsNeeded?: string;
  referralTypes?: string[];
  agenciesToContact?: string;
  clientConsented?: string;
  appointmentsNeeded?: string;
  accompanimentSupport?: string;

  // Step 7: Review and Follow-Up
  beforeNextReview?: string;
  nextFollowUpDate?: string;
  reviewDate?: string;
  createTasksFromSteps?: string;
  createReferralsFromPlan?: string;
  requestSupervisorReview?: string;
  staffFollowUpNotes?: string;
}

const safe = (v?: string | string[]) => {
  if (!v) return "Not documented.";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "Not documented.";
  return v.trim() || "Not documented.";
};

const yesNo = (v?: string) => {
  if (!v) return "Not documented.";
  const l = v.toLowerCase().trim();
  if (l === "yes" || l === "true" || l === "y") return "Yes";
  if (l === "no" || l === "false" || l === "n") return "No";
  return v;
};

export const generateServicePlanText = (
  client: Client,
  completedBy: string,
  siteName: string,
  answers: ServicePlanAnswers
): string => {
  const today = new Date().toLocaleDateString("en-CA");

  const actionStepsText = (answers.actionSteps || [])
    .map(
      (step, i) =>
        `${i + 1}. Goal Category: ${step.category}\n   Action: ${step.action}\n   Responsible Person: ${step.responsible}\n   Due Date: ${step.dueDate}\n   Follow-Up Date: ${step.followUpDate}\n   Status: ${step.status}`
    )
    .join("\n\n");

  return [
    `SERVICE PLAN / GOALS`,
    ``,
    `Client: ${client.displayName}`,
    `Client Code: ${client.clientCode}`,
    `Date Completed: ${today}`,
    `Completed By: ${completedBy}`,
    `Shelter / Site: ${siteName}`,
    ``,
    `─────────────────────────────────────────`,
    `CLIENT PRIORITIES AND GOALS`,
    `─────────────────────────────────────────`,
    `Main priorities:`,
    safe(answers.priorities),
    ``,
    `Primary goal:`,
    safe(answers.primaryGoal),
    ``,
    `Secondary goals:`,
    safe(answers.secondaryGoals),
    ``,
    `Immediate support requested:`,
    safe(answers.supportFirst),
    ``,
    `Client participated in planning: ${yesNo(answers.clientParticipated)}`,
    `Client agreed with documented goals: ${yesNo(answers.clientAgreed)}`,
    ``,
    `─────────────────────────────────────────`,
    `CURRENT NEEDS`,
    `─────────────────────────────────────────`,
    `Identified needs: ${safe(answers.identifiedNeeds)}`,
    ``,
    `Urgent needs:`,
    safe(answers.urgentNeeds),
    ``,
    `Ongoing needs:`,
    safe(answers.ongoingNeeds),
    ``,
    `Needs already being addressed:`,
    safe(answers.needsAddressed),
    ``,
    `─────────────────────────────────────────`,
    `STRENGTHS AND SUPPORTS`,
    `─────────────────────────────────────────`,
    `Client strengths:`,
    safe(answers.strengths),
    ``,
    `What has helped in the past:`,
    safe(answers.pastSuccess),
    ``,
    `Community, family, or cultural supports:`,
    safe(answers.communitySupports),
    ``,
    `Connected agencies or workers:`,
    safe(answers.involvedAgencies),
    ``,
    `Coping skills and motivators:`,
    safe(answers.copingSkills),
    ``,
    `─────────────────────────────────────────`,
    `BARRIERS AND CHALLENGES`,
    `─────────────────────────────────────────`,
    `Identified barriers: ${safe(answers.barriers)}`,
    ``,
    `Main challenge at this time:`,
    safe(answers.mainChallenge),
    ``,
    `System barriers or navigation difficulties:`,
    safe(answers.systemBarriers),
    ``,
    `Requested support to reduce barriers:`,
    safe(answers.barrierSupport),
    ``,
    `─────────────────────────────────────────`,
    `ACTION STEPS`,
    `─────────────────────────────────────────`,
    actionStepsText || "No action steps documented.",
    ``,
    `─────────────────────────────────────────`,
    `REFERRALS AND SUPPORTS`,
    `─────────────────────────────────────────`,
    `Referrals needed: ${yesNo(answers.referralsNeeded)}`,
    `Types: ${safe(answers.referralTypes)}`,
    `Agencies to contact: ${safe(answers.agenciesToContact)}`,
    ``,
    `Consent provided for referrals: ${yesNo(answers.clientConsented)}`,
    `Appointments or accompaniment needed: ${safe(answers.appointmentsNeeded)}`,
    ``,
    `─────────────────────────────────────────`,
    `CLIENT PARTICIPATION / AGREEMENT`,
    `─────────────────────────────────────────`,
    answers.clientAgreed === "yes"
      ? "Client actively participated in setting these goals and expressed agreement with the action steps and responsibilities documented above."
      : "Case planning discussion completed. Agreement status not explicitly confirmed.",
    ``,
    `─────────────────────────────────────────`,
    `FOLLOW-UP AND REVIEW`,
    `─────────────────────────────────────────`,
    `Next Follow-Up Date: ${safe(answers.nextFollowUpDate)}`,
    `Service Plan Review Date: ${safe(answers.reviewDate)}`,
    ``,
    `─────────────────────────────────────────`,
    `WORKER SUMMARY`,
    `─────────────────────────────────────────`,
    `Service plan developed with client to address immediate needs and work towards long-term stability. Action steps and responsibilities have been clarified. Referrals and follow-ups scheduled as noted. Professional summary completed for SMIS documentation.`,
  ].join("\n");
};
