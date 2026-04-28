import { Client } from "@/types";

export interface IntakeAssessmentAnswers {
  consentSigned?: boolean;
  privacyExplained?: boolean;
  legalFirstName?: string;
  legalLastName?: string;
  dateOfBirth?: string;
  sin?: string;
  healthCardNumber?: string;
  homelessnessReason?: string;
  lastStableHousing?: string;
  priorityNeeds?: string[];
  nextAction?: string;
  dueDate?: string;
}

export const generateIntakeAssessmentText = (
  client: Client,
  workerName: string,
  siteName: string,
  answers: IntakeAssessmentAnswers
): string => {
  const now = new Date().toLocaleString();

  return `
====================================================
INTAKE ASSESSMENT - SMIS-READY DOCUMENTATION
====================================================
CLIENT: ${client.displayName} (${client.clientCode})
DATE COMPLETED: ${now}
CASEWORKER: ${workerName}
SITE: ${siteName}
----------------------------------------------------

1. CONSENT & PRIVACY
- Consent to Share Information Signed: ${answers.consentSigned ? "YES" : "NO"}
- Privacy Policy Explained: ${answers.privacyExplained ? "YES" : "NO"}

2. PERSONAL IDENTITY & IDENTIFICATION
- Legal Name: ${answers.legalFirstName} ${answers.legalLastName}
- Date of Birth: ${answers.dateOfBirth || "Not Documented"}
- SIN: ${answers.sin ? "Documented" : "Pending/Missing"}
- Health Card Number: ${answers.healthCardNumber ? "Documented" : "Pending/Missing"}

3. HOUSING HISTORY
- Primary Reason for Homelessness: ${answers.homelessnessReason || "Not Documented"}
- Last Stable Housing/Address: ${answers.lastStableHousing || "Not Documented"}

4. IDENTIFIED NEEDS & PRIORITIES
- Priorities: ${answers.priorityNeeds?.map(n => n.replace("_", " ")).join(", ") || "None selected"}

5. INITIAL ACTION PLAN
- Recommended Next Step: ${answers.nextAction || "Complete Housing Plan"}
- Target Date: ${answers.dueDate || "Within 7 days"}

----------------------------------------------------
END OF INTAKE ASSESSMENT DOCUMENTATION
====================================================
  `.trim();
};
