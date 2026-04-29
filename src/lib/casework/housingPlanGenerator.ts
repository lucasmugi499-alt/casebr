import { Client } from "@/types";

export type HousingType =
  | "independent_housing"
  | "supportive_housing"
  | "transitional_housing"
  | "rooming_house"
  | "family_reunification"
  | "shelter_transfer"
  | "other";

export type IncomeSource = "OW" | "ODSP" | "employment" | "pension" | "EI" | "no_income" | "other";

export type BarrierType =
  | "income"
  | "id_documents"
  | "rental_arrears"
  | "credit_history"
  | "mental_health"
  | "substance_use"
  | "legal_issues"
  | "discrimination"
  | "accessibility"
  | "family_conflict"
  | "safety_concerns"
  | "lack_of_references"
  | "other";

export type ResponsiblePerson = "client" | "caseworker" | "housing_worker" | "external_agency" | "other";

export interface HousingPlanAnswers {
  // Step 1: Housing Goal
  housingGoal?: string;
  housingType?: HousingType | string;
  locationPreference?: string;
  accessibilityNeeds?: string;
  safetyConcerns?: string;

  // Step 2: Current Housing Situation
  currentStay?: string;
  shelterDuration?: string;
  housingInstabilityReason?: string;
  previousHousing?: string;
  previousHousingEnd?: string;
  riskOfLoss?: string;

  // Step 3: Income and Affordability
  hasIncome?: string;
  incomeSource?: IncomeSource | string;
  monthlyIncome?: string;
  benefitSupportNeeded?: string;
  hasBankAccount?: string;
  proofOfIncome?: string;

  // Step 4: Identification and Documents
  hasGovernmentId?: string;
  hasHealthCard?: string;
  hasSIN?: string;
  hasBirthCert?: string;
  hasProofOfIncome?: string;
  hasNoticeOfAssessment?: string;
  missingDocuments?: string;
  documentSupportNeeded?: string;

  // Step 5: Housing Applications and Referrals
  applicationsStarted?: string;
  subsidizedHousing?: string;
  supportiveHousing?: string;
  housingWorkerReferral?: string;
  agenciesInvolved?: string;
  pendingApplications?: string;
  upcomingAppointments?: string;

  // Step 6: Barriers
  barriers?: BarrierType[] | string[];
  mainBarrier?: string;
  barrierSupport?: string;

  // Step 7: Strengths and Supports
  strengths?: string;
  communitySupports?: string;
  agencyConnections?: string;
  willingHousingWorker?: string;
  workedBefore?: string;

  // Step 8: Action Plan
  nextAction?: string;
  responsible?: ResponsiblePerson | string;
  dueDate?: string;
  followUpDate?: string;
  createReferral?: string;
  createTask?: string;
  clientAgreement?: string;

  // Step 9: Review (no extra fields)

  // Final: Review date
  reviewDate?: string;

  // Legacy / misc
  affordability?: string;
  documentStatus?: string;
  supports?: string;
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

const docStatus = (v?: string) => {
  const r = yesNo(v);
  return r === "Yes" ? "Present" : r === "No" ? "Missing / Not confirmed" : "Not documented.";
};

const housingTypeLabel: Record<string, string> = {
  independent_housing: "Independent housing",
  supportive_housing: "Supportive housing",
  transitional_housing: "Transitional housing",
  rooming_house: "Rooming house / shared accommodation",
  family_reunification: "Family reunification",
  shelter_transfer: "Shelter transfer",
  other: "Other (as described by client)",
};

const responsibleLabel: Record<string, string> = {
  client: "Client",
  caseworker: "Caseworker",
  housing_worker: "Housing worker",
  external_agency: "External agency",
  other: "Other",
};

const barrierLabel: Record<string, string> = {
  income: "Income",
  id_documents: "ID / Documents",
  rental_arrears: "Rental arrears",
  credit_history: "Credit history",
  mental_health: "Mental health",
  substance_use: "Substance use",
  legal_issues: "Legal issues",
  discrimination: "Discrimination",
  accessibility: "Accessibility",
  family_conflict: "Family conflict",
  safety_concerns: "Safety concerns",
  lack_of_references: "Lack of references",
  other: "Other",
};

export const generateHousingPlanText = (
  client: Client,
  completedBy: string,
  siteName: string,
  answers: HousingPlanAnswers
): string => {
  const today = new Date().toLocaleDateString("en-CA");
  const barriers = Array.isArray(answers.barriers)
    ? answers.barriers.map((b) => barrierLabel[b] ?? b).join(", ")
    : safe(answers.barriers);
  const housing = housingTypeLabel[answers.housingType ?? ""] ?? safe(answers.housingType);
  const responsible = responsibleLabel[answers.responsible ?? ""] ?? safe(answers.responsible);

  return [
    `HOUSING PLAN`,
    ``,
    `Client: ${client.displayName}`,
    `Client Code: ${client.clientCode}`,
    `Date Completed: ${today}`,
    `Completed By: ${completedBy}`,
    `Shelter / Site: ${siteName}`,
    ``,
    `─────────────────────────────────────────`,
    `CURRENT HOUSING GOAL`,
    `─────────────────────────────────────────`,
    safe(answers.housingGoal),
    ``,
    `Housing type sought: ${housing}`,
    answers.locationPreference ? `Preferred location: ${answers.locationPreference}` : `Preferred location: Not documented.`,
    answers.accessibilityNeeds ? `Accessibility needs: ${answers.accessibilityNeeds}` : `Accessibility needs: None identified.`,
    answers.safetyConcerns ? `Safety / location concerns: ${answers.safetyConcerns}` : `Safety / location concerns: None documented.`,
    ``,
    `─────────────────────────────────────────`,
    `CURRENT HOUSING SITUATION`,
    `─────────────────────────────────────────`,
    `Current placement: ${safe(answers.currentStay)}`,
    `Length of time in current placement: ${safe(answers.shelterDuration)}`,
    ``,
    `Circumstances leading to current housing instability:`,
    safe(answers.housingInstabilityReason),
    ``,
    answers.previousHousing ? `Previous housing: ${answers.previousHousing}` : `Previous housing: Not documented.`,
    answers.previousHousingEnd ? `Reason previous housing ended: ${answers.previousHousingEnd}` : `Reason previous housing ended: Not documented.`,
    `Risk of losing current placement or shelter bed: ${safe(answers.riskOfLoss)}`,
    ``,
    `─────────────────────────────────────────`,
    `INCOME AND AFFORDABILITY`,
    `─────────────────────────────────────────`,
    `Has income: ${yesNo(answers.hasIncome)}`,
    `Income source: ${safe(answers.incomeSource)}`,
    `Monthly income: ${safe(answers.monthlyIncome)}`,
    `Benefit support needed: ${yesNo(answers.benefitSupportNeeded)}`,
    `Has bank account: ${yesNo(answers.hasBankAccount)}`,
    `Proof of income available: ${yesNo(answers.proofOfIncome)}`,
    ``,
    `─────────────────────────────────────────`,
    `IDENTIFICATION AND REQUIRED DOCUMENTS`,
    `─────────────────────────────────────────`,
    `Government-issued photo ID: ${docStatus(answers.hasGovernmentId)}`,
    `Health card: ${docStatus(answers.hasHealthCard)}`,
    `Social Insurance Number (SIN): ${docStatus(answers.hasSIN)}`,
    `Birth certificate: ${docStatus(answers.hasBirthCert)}`,
    `Proof of income: ${docStatus(answers.hasProofOfIncome)}`,
    `Notice of Assessment: ${docStatus(answers.hasNoticeOfAssessment)}`,
    ``,
    answers.missingDocuments ? `Documents to be obtained: ${answers.missingDocuments}` : `Documents to be obtained: Not documented.`,
    answers.documentSupportNeeded ? `Document support required: ${answers.documentSupportNeeded}` : `Document support required: Not documented.`,
    ``,
    `─────────────────────────────────────────`,
    `HOUSING APPLICATIONS AND REFERRALS`,
    `─────────────────────────────────────────`,
    `Housing application started: ${yesNo(answers.applicationsStarted)}`,
    `Applied for subsidized housing: ${yesNo(answers.subsidizedHousing)}`,
    `Applied for supportive housing: ${yesNo(answers.supportiveHousing)}`,
    `Referred to housing worker or agency: ${yesNo(answers.housingWorkerReferral)}`,
    ``,
    answers.agenciesInvolved ? `Agencies involved: ${answers.agenciesInvolved}` : `Agencies involved: Not documented.`,
    answers.pendingApplications ? `Pending applications: ${answers.pendingApplications}` : `Pending applications: Not documented.`,
    answers.upcomingAppointments ? `Upcoming housing appointments or viewings: ${answers.upcomingAppointments}` : `Upcoming appointments: Not documented.`,
    ``,
    `─────────────────────────────────────────`,
    `BARRIERS TO HOUSING`,
    `─────────────────────────────────────────`,
    `Identified barriers: ${barriers}`,
    `Client-identified main barrier: ${safe(answers.mainBarrier)}`,
    ``,
    answers.barrierSupport
      ? `Supports that may help reduce barriers: ${answers.barrierSupport}`
      : `Supports that may help reduce barriers: Not documented.`,
    ``,
    `─────────────────────────────────────────`,
    `STRENGTHS AND SUPPORTS`,
    `─────────────────────────────────────────`,
    answers.strengths ? `Client strengths: ${answers.strengths}` : `Client strengths: Not documented.`,
    answers.communitySupports
      ? `Family, friends, or community supports: ${answers.communitySupports}`
      : `Family, friends, or community supports: Not documented.`,
    answers.agencyConnections
      ? `Connected agencies or services: ${answers.agencyConnections}`
      : `Connected agencies or services: Not documented.`,
    `Willing to work with a housing worker: ${yesNo(answers.willingHousingWorker)}`,
    answers.workedBefore ? `Strategies that have worked in the past: ${answers.workedBefore}` : `Past successful strategies: Not documented.`,
    ``,
    `─────────────────────────────────────────`,
    `ACTION PLAN`,
    `─────────────────────────────────────────`,
    `Next housing action: ${safe(answers.nextAction)}`,
    `Responsible person: ${responsible}`,
    `Due date: ${safe(answers.dueDate)}`,
    `Follow-up date: ${safe(answers.followUpDate)}`,
    ``,
    `─────────────────────────────────────────`,
    `CLIENT AGREEMENT AND PARTICIPATION`,
    `─────────────────────────────────────────`,
    answers.clientAgreement
      ? answers.clientAgreement
      : `Client participated in the housing planning discussion. Agreement status not documented.`,
    ``,
    `─────────────────────────────────────────`,
    `NEXT REVIEW DATE`,
    `─────────────────────────────────────────`,
    safe(answers.reviewDate),
    ``,
    `─────────────────────────────────────────`,
    `WORKER SUMMARY`,
    `─────────────────────────────────────────`,
    `Housing plan completed with client input. Current housing needs, barriers, strengths, and next actions have been documented. Next steps and responsible parties have been reviewed. Plan is suitable for entry into SMIS.`,
  ].join("\n");
};
