import { Client, DocumentChecklist } from "@/types";

export function generateDocumentChecklistText(client: Client, checklist: DocumentChecklist): string {
  const timestamp = new Date().toLocaleString();
  
  return `DOCUMENT CHECKLIST SUMMARY
Client: ${client.displayName} (${client.clientCode})
Site: ${client.siteId}
Generated: ${timestamp}

--------------------------------------------------
IDENTIFICATION DOCUMENTS
--------------------------------------------------
Government Photo ID:    ${checklist.governmentId.toUpperCase()}
Health Card:            ${checklist.healthCard.toUpperCase()}
SIN:                    ${checklist.sin.toUpperCase()}

--------------------------------------------------
FINANCIAL DOCUMENTS
--------------------------------------------------
Proof of Income:        ${checklist.proofOfIncome.toUpperCase()}
Notice of Assessment:   ${checklist.noticeOfAssessment.toUpperCase()}

--------------------------------------------------
HOUSING & LEGAL DOCUMENTS
--------------------------------------------------
Housing Records:        ${checklist.housingDocuments.toUpperCase()}
Medical Documentation:  ${checklist.medicalDocuments.toUpperCase()}
Legal / Immigration:    ${checklist.legalDocuments.toUpperCase()}

--------------------------------------------------
SUMMARY STATUS
--------------------------------------------------
Last Updated: ${checklist.updatedAt || timestamp}
${Object.values(checklist).filter(v => typeof v === 'string' && v === 'complete').length} of 8 documents complete.
`;
}
