import { Client, ContactType, NoteCategory, WorkstreamType } from "@/types";

export interface CaseNoteAnswers {
  // Contact Details
  contactDate: string;
  contactTime: string;
  contactType: ContactType;
  location: string;
  noteCategory: NoteCategory;
  
  // Link to Work
  relatedNeedId?: string;
  relatedWorkstream?: WorkstreamType;
  relatedPlanType?: string;
  relatedTaskId?: string;
  relatedReferralId?: string;
  
  // What Happened
  roughSummary: string;
  clientReport: string;
  staffObservation: string;
  actionTaken: string;
  clientResponse: string;
  outcome: string;
  
  // Follow-Up
  followUpRequired: boolean;
  nextAction?: string;
  responsiblePerson?: string;
  dueDate?: string;
}

export const generateCaseNoteText = (
  client: Client,
  authorName: string,
  siteName: string,
  answers: CaseNoteAnswers
): string => {
  const {
    contactDate,
    contactTime,
    contactType,
    location,
    noteCategory,
    roughSummary,
    clientReport,
    staffObservation,
    actionTaken,
    outcome,
    nextAction,
    responsiblePerson,
    dueDate,
    relatedWorkstream,
    relatedPlanType
  } = answers;

  const safe = (v?: string) => (v && v.trim() ? v.trim() : "Not documented.");

  return [
    `CASE NOTE`,
    ``,
    `Client: ${client.displayName}`,
    `Client Code: ${client.clientCode}`,
    `Date/Time of Contact: ${contactDate} at ${contactTime}`,
    `Contact Type: ${contactType.replace("_", " ")}`,
    `Location: ${location}`,
    `Completed By: ${authorName}`,
    `Related Workstream: ${safe(relatedWorkstream?.replace("_", " "))}`,
    `Related Plan/Document: ${safe(relatedPlanType)}`,
    ``,
    `Summary of Contact:`,
    safe(roughSummary),
    ``,
    `Client Report:`,
    safe(clientReport),
    ``,
    `Staff Observation:`,
    safe(staffObservation),
    ``,
    `Action Taken:`,
    safe(actionTaken),
    ``,
    `Outcome:`,
    safe(outcome),
    ``,
    `Follow-Up Plan:`,
    answers.followUpRequired 
      ? `Next Action: ${safe(nextAction)}\nResponsible Person: ${safe(responsiblePerson)}\nDue Date: ${safe(dueDate)}`
      : `No immediate follow-up required.`,
    ``,
    `Worker Summary:`,
    `Contact completed to address ${noteCategory.replace("_", " ")} goals. Client participated in the discussion and agreed to the follow-up steps as outlined above. Documentation completed for site records and SMIS entry.`
  ].join("\n");
};
