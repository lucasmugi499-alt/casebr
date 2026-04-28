import { Client } from "@/types";

export interface HousingPlanAnswers {
  housingGoal?: string;
  housingType?: string;
  preferredArea?: string;
  accessibilityNeeds?: string;
  safetyConcerns?: string;
  currentStay?: string;
  shelterDuration?: string;
  housingInstabilityReason?: string;
  previousHousing?: string;
  incomeSource?: string;
  monthlyIncome?: string;
  affordability?: string;
  benefitSupportNeeded?: string;
  bankAccount?: string;
  proofOfIncome?: string;
  documentStatus?: string;
  missingDocuments?: string;
  documentSupportNeeded?: string;
  applicationsStarted?: string;
  agenciesInvolved?: string;
  pendingApplications?: string;
  appointments?: string;
  barriers?: string;
  mainBarrier?: string;
  barrierSupport?: string;
  strengths?: string;
  supports?: string;
  willingHousingWorker?: string;
  workedBefore?: string;
  nextAction?: string;
  responsible?: string;
  dueDate?: string;
  followUpDate?: string;
  createReferral?: string;
  createTask?: string;
  clientAgreement?: string;
  reviewDate?: string;
}

const safe = (v?: string) => (v && v.trim() ? v.trim() : "Not documented.");

export const generateHousingPlanText = (client: Client, completedBy: string, siteName: string, answers: HousingPlanAnswers): string => {
  return `HOUSING PLAN\n\nClient: ${client.displayName}\nClient Code: ${client.clientCode}\nDate Completed: ${new Date().toLocaleDateString()}\nCompleted By: ${completedBy}\nShelter/Site: ${siteName}\n\nCurrent Housing Goal:\n${safe(answers.housingGoal)}\n\nCurrent Housing Situation:\n${safe(answers.currentStay)} ${safe(answers.shelterDuration)} ${safe(answers.housingInstabilityReason)}\n\nIncome and Affordability:\nIncome Source: ${safe(answers.incomeSource)} Monthly Income: ${safe(answers.monthlyIncome)} Affordability: ${safe(answers.affordability)}\n\nIdentification and Required Documents:\nDocument status: ${safe(answers.documentStatus)} Missing: ${safe(answers.missingDocuments)} Support needed: ${safe(answers.documentSupportNeeded)}\n\nHousing Applications / Referrals:\nApplications started: ${safe(answers.applicationsStarted)} Agencies involved: ${safe(answers.agenciesInvolved)} Pending: ${safe(answers.pendingApplications)}\n\nBarriers to Housing:\nBarriers: ${safe(answers.barriers)} Main barrier: ${safe(answers.mainBarrier)} Supports requested: ${safe(answers.barrierSupport)}\n\nStrengths and Supports:\nStrengths: ${safe(answers.strengths)} Supports: ${safe(answers.supports)} Past successful strategies: ${safe(answers.workedBefore)}\n\nAction Plan:\n- Action: ${safe(answers.nextAction)}\n- Responsible Person: ${safe(answers.responsible)}\n- Due Date: ${safe(answers.dueDate)}\n- Follow-Up Date: ${safe(answers.followUpDate)}\n\nClient Agreement / Participation:\n${safe(answers.clientAgreement)}\n\nNext Review Date:\n${safe(answers.reviewDate)}\n\nWorker Summary:\nPlan completed with client participation. Next actions and responsibilities were reviewed and documented.`;
};
