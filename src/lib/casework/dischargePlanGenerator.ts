import { Client } from "@/types";

export interface DischargePlanAnswers {
  // Step 1
  reason?: string;
  transitionType?: 'planned' | 'client_led' | 'transfer' | 'housing' | 'administrative' | 'other';
  expectedDate?: string;
  clientInvolved?: boolean;
  clientAgrees?: boolean;
  
  // Step 2
  caseworkSummary?: string;
  remainingWork?: string;
  
  // Step 3
  destination?: string;
  destinationType?: 'permanent' | 'supportive' | 'transitional' | 'shelter' | 'family' | 'hospital' | 'unknown' | 'other';
  followUpHousingNeeded?: boolean;
  housingNotes?: string;
  
  // Step 4
  incomeStatus?: string;
  missingDocs?: string;
  basicNeedsStatus?: string;
  
  // Step 5
  healthFollowUps?: string;
  mentalHealthSupports?: string;
  harmReductionSupports?: string;
  safetyPlanStatus?: string;
  supportContacts?: string;
  
  // Step 6
  activeReferrals?: string;
  followUpActions?: string;
  importantDates?: string;
  
  // Step 7
  clientPerspective?: string;
  unresolvedConcerns?: string;
  finalStaffNotes?: string;
  
  // Step 8: Action Plan (simplified for generator)
  actions?: Array<{
    action: string;
    responsible: string;
    dueDate: string;
    followUpDate: string;
    status: string;
  }>;

  // Final Recommendation
  recommendedStatus?: string;
  workerSummary?: string;
}

export const generateDischargePlanText = (
  client: Client,
  workerName: string,
  siteName: string,
  answers: DischargePlanAnswers
): string => {
  const date = new Date().toLocaleDateString();
  
  let text = `DISCHARGE / TRANSITION PLAN\n\n`;
  text += `Client: ${client.displayName}\n`;
  text += `Client Code: ${client.clientCode}\n`;
  text += `Date Completed: ${date}\n`;
  text += `Completed By: ${workerName}\n`;
  text += `Shelter/Site: ${siteName}\n\n`;

  text += `REASON FOR DISCHARGE / TRANSITION\n`;
  text += `Reason: ${answers.reason || "Not documented"}\n`;
  text += `Type: ${answers.transitionType?.replace('_', ' ') || "Not documented"}\n`;
  text += `Target Date: ${answers.expectedDate || "Not documented"}\n`;
  text += `Client Involved: ${answers.clientInvolved ? "Yes" : "No"}\n`;
  text += `Client Agrees with Plan: ${answers.clientAgrees ? "Yes" : "No"}\n\n`;

  text += `CURRENT CASEWORK SUMMARY\n`;
  text += `${answers.caseworkSummary || "Not documented"}\n\n`;
  text += `Outstanding Items:\n`;
  text += `${answers.remainingWork || "Not documented"}\n\n`;

  text += `HOUSING / DESTINATION PLAN\n`;
  text += `Destination: ${answers.destination || "Not documented"}\n`;
  text += `Placement Type: ${answers.destinationType?.replace('_', ' ') || "Not documented"}\n`;
  text += `Follow-up Housing Support Needed: ${answers.followUpHousingNeeded ? "Yes" : "No"}\n`;
  text += `Details: ${answers.housingNotes || "Not documented"}\n\n`;

  text += `INCOME, DOCUMENTS, AND BASIC NEEDS\n`;
  text += `Income/Benefits Status: ${answers.incomeStatus || "Not documented"}\n`;
  text += `Document Gaps: ${answers.missingDocs || "Not documented"}\n`;
  text += `Basic Needs: ${answers.basicNeedsStatus || "Not documented"}\n\n`;

  text += `HEALTH, SAFETY, AND SUPPORT CONNECTIONS\n`;
  text += `Health Follow-ups: ${answers.healthFollowUps || "Not documented"}\n`;
  text += `Mental Health/Counselling: ${answers.mentalHealthSupports || "Not documented"}\n`;
  text += `Safety Plan Status: ${answers.safetyPlanStatus || "Not documented"}\n`;
  text += `Ongoing Support Contacts: ${answers.supportContacts || "Not documented"}\n\n`;

  text += `REFERRALS AND FOLLOW-UP SUPPORTS\n`;
  text += `Active Referrals: ${answers.activeReferrals || "Not documented"}\n`;
  text += `Required Follow-up Actions: ${answers.followUpActions || "Not documented"}\n`;
  text += `Key Dates: ${answers.importantDates || "Not documented"}\n\n`;

  text += `CLIENT PARTICIPATION AND PERSPECTIVE\n`;
  text += `${answers.clientPerspective || "Not documented"}\n\n`;

  text += `UNRESOLVED CONCERNS\n`;
  text += `${answers.unresolvedConcerns || "Not documented"}\n\n`;

  text += `FINAL ACTION PLAN\n`;
  if (answers.actions && answers.actions.length > 0) {
    answers.actions.forEach((a, i) => {
      text += `${i + 1}. Action: ${a.action}\n`;
      text += `   Responsible: ${a.responsible}\n`;
      text += `   Due: ${a.dueDate} | Follow-up: ${a.followUpDate}\n`;
      text += `   Status: ${a.status}\n\n`;
    });
  } else {
    text += `No action steps documented.\n\n`;
  }

  text += `RECOMMENDED CLIENT STATUS UPDATE\n`;
  text += `${answers.recommendedStatus || "Not documented"}\n\n`;

  text += `WORKER SUMMARY\n`;
  text += `${answers.workerSummary || "Not documented"}\n`;

  return text;
};
