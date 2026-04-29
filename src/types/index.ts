export type Role = 'caseworker' | 'ssa' | 'manager' | 'admin';

export type EntityStatus = 'active' | 'inactive';

export interface OrganizationSettings {
  allowAI: boolean;
  allowVoiceNotes: boolean;
  dataRetentionMonths: number;
  requireSupervisorReviewForHighRisk: boolean;
  clientIdentifierMode: 'client_code' | 'display_name';
}

export interface Organization {
  id: string;
  name: string;
  status: EntityStatus;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  type: 'shelter' | 'drop_in' | 'outreach_hub' | 'supportive_housing' | 'other';
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  organizationId: string;
  siteIds: string[];
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  title: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type User = UserProfile;

export type ClientStatus = 'intake' | 'active' | 'follow_up_needed' | 'housed' | 'discharged' | 'inactive' | 'transferred' | 'follow_up_support';
export type Priority = 'low' | 'medium' | 'high';

export interface Client {
  id: string;
  organizationId: string;
  siteId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;
  clientCode: string;
  dateOfBirth?: string;
  ageRange?: string;
  gender?: string;
  pronouns?: string;
  assignedWorkerIds: string[];
  status: ClientStatus;
  priority: Priority;
  currentGoal: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export type ContactType =
  | 'in_person'
  | 'phone'
  | 'email'
  | 'outreach'
  | 'appointment_accompaniment'
  | 'case_conference'
  | 'crisis_support'
  | 'informal_check_in'
  | 'referral_support'
  | 'housing_support'
  | 'intake_follow_up'
  | 'plan_review'
  | 'document_support'
  | 'other';

export type NoteCategory =
  | 'general_check_in'
  | 'housing'
  | 'income_support'
  | 'identification'
  | 'mental_health'
  | 'substance_use'
  | 'safety_planning'
  | 'medical_health'
  | 'employment'
  | 'legal'
  | 'family_supports'
  | 'behavioural_incident_follow_up'
  | 'discharge_planning'
  | 'system_navigation'
  | 'referral_follow_up'
  | 'service_plan_update'
  | 'document_checklist_update'
  | 'intake_assessment';

export interface CaseNote {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  authorId: string;
  authorName?: string;
  contactDate: string;
  contactType: ContactType;
  category: NoteCategory;
  location?: string;
  roughSummary: string;
  actionsTaken?: string;
  referralsMade?: string;
  followUpRequired: boolean;
  riskSafetyConcerns?: string;
  finalNote: string;
  aiGenerated: boolean;
  aiActionUsed?: string;
  supervisorReviewed: boolean;
  supervisorReviewId?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface Task {
  id: string;
  organizationId: string;
  siteId: string;
  clientId?: string;
  assignedToId: string;
  createdById: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReferralStatus = 'pending' | 'completed' | 'declined' | 'no_response' | 'cancelled';
export type ReferralType = 'housing' | 'income' | 'medical' | 'mental_health' | 'legal' | 'employment' | 'substance_use' | 'food_bank' | 'other';

export interface Referral {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  createdById: string;
  referralType: ReferralType;
  agencyName: string;
  contactPerson?: string;
  contactInfo?: string;
  referralDate: string;
  status: ReferralStatus;
  followUpDate?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskFlag {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  createdById: string;
  category: string;
  severity: RiskSeverity;
  description: string;
  active: boolean;
  supervisorReviewRequired: boolean;
  reviewedById?: string;
  reviewedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyPlan {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  createdById: string;
  concernSummary: string;
  triggers: string;
  copingStrategies: string;
  supports: string;
  staffActions: string;
  emergencySteps: string;
  clientAgreed: boolean;
  reviewDate: string;
  status: 'active' | 'review_due' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface SupervisorReview {
  id: string;
  organizationId: string;
  siteId: string;
  clientId?: string;
  caseNoteId?: string;
  riskFlagId?: string;
  supervisorId: string;
  workerId?: string;
  submittedByName?: string;
  reviewType: 'case_note_review' | 'risk_review' | 'safety_plan_review' | 'documentation_gap' | 'workload_support' | 'client_progress' | 'assignment_note' | 'general_supervision';
  status?: "pending" | "completed" | "no_action_required";
  priority?: "low" | "medium" | "high" | "urgent";
  comment: string;
  actionRequired: boolean;
  actionDueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  siteId?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineItem {
  id: string;
  clientId: string;
  type:
    | 'case_note'
    | 'task'
    | 'referral'
    | 'risk_flag'
    | 'safety_plan'
    | 'generated_document'
    | 'intake_assessment'
    | 'assignment'
    | 'supervisor_review'
    | 'status_change'
    | 'workstream_update';
  date: string;
  title: string;
  summary: string;
  staffId: string;
  staffName?: string;
  entityId: string;
  entityType: string;
  workstreamType?: WorkstreamType;
  status?: string;
}

export interface DashboardMetric {
  label: string;
  value: number;
  change?: string;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
}

export interface ServiceActor {
  id: string;
  organizationId: string;
  role: Role;
  siteIds: string[];
  firstName: string;
  lastName: string;
}

export type WorkstreamType =
  | 'housing'
  | 'income_benefits'
  | 'identification_documents'
  | 'health_medical'
  | 'mental_health'
  | 'substance_use_support'
  | 'legal'
  | 'employment'
  | 'family_supports'
  | 'safety'
  | 'life_skills'
  | 'other';

export type WorkstreamStatus =
  | 'not_started'
  | 'in_progress'
  | 'waiting_on_client'
  | 'waiting_on_agency'
  | 'blocked'
  | 'completed'
  | 'paused'
  | 'closed';

export interface Workstream {
  id: string;
  clientId: string;
  type: WorkstreamType;
  status: WorkstreamStatus;
  latestAction: string;
  nextAction: string;
  dueDate?: string;
  assignedWorkerId: string;
  linkedNoteIds: string[];
  linkedTaskIds: string[];
  linkedReferralIds: string[];
  linkedDocumentIds?: string[];
  priority: Priority;
  updatedAt: string;
}

export type ClientNeedType =
  | 'housing_support'
  | 'income_benefits_support'
  | 'identification_documents_support'
  | 'health_medical_support'
  | 'mental_health_support'
  | 'substance_use_support'
  | 'legal_support'
  | 'employment_support'
  | 'safety_planning'
  | 'family_community_supports'
  | 'life_skills_support'
  | 'discharge_transition_planning'
  | 'appointment_accompaniment'
  | 'referral_follow_up'
  | 'service_planning'
  | 'intake_assessment'
  | 'document_checklist';

export type NeedStatus =
  | 'identified'
  | 'in_progress'
  | 'waiting_on_client'
  | 'waiting_on_agency'
  | 'blocked'
  | 'completed'
  | 'closed';

export type NeedPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ClientNeed {
  id: string;
  clientId: string;
  needType: ClientNeedType;
  status: NeedStatus;
  priority: NeedPriority;
  sourceOfNeed: string;
  dateIdentified: string;
  identifiedBy: string;
  linkedWorkstreamId?: string;
  recommendedNextAction: string;
  relatedDocumentTypes: GeneratedDocumentType[];
  relatedTaskIds: string[];
  relatedReferralIds: string[];
}

export type GeneratedDocumentType =
  | 'housing_plan'
  | 'safety_plan'
  | 'service_plan'
  | 'intake_assessment'
  | 'document_checklist'
  | 'discharge_transition_plan'
  | 'supervisor_summary'
  | 'case_summary';

export type GeneratedDocumentStatus = 'draft' | 'completed' | 'copied_to_smis' | 'review_due' | 'archived';

export interface GeneratedDocument {
  id: string;
  clientId: string;
  organizationId: string;
  siteId: string;
  type: GeneratedDocumentType;
  title: string;
  status: GeneratedDocumentStatus;
  generatedText: string;
  sourceAnswers: Record<string, unknown>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  copiedToSmisAt?: string;
  reviewDate?: string;
}

export interface DocumentationChecklist {
  clientId: string;
  intakeCompleted: boolean;
  consentCompleted: boolean;
  privacyExplained: boolean;
  servicePlanStarted: boolean;
  servicePlanCompleted: boolean;
  housingPlanStarted: boolean;
  safetyScreeningCompleted: boolean;
  safetyPlanCompleted: boolean;
  idStatusDocumented: boolean;
  incomeStatusDocumented: boolean;
  emergencyContactDocumented: boolean;
  referralsDocumented: boolean;
  dischargeTransitionPlanDocumented: boolean;
  updatedAt: string;
}

export type DocumentChecklistStatus = 'complete' | 'missing' | 'requested' | 'not_applicable';

export interface DocumentChecklist {
  clientId: string;
  governmentId: DocumentChecklistStatus;
  healthCard: DocumentChecklistStatus;
  sin: DocumentChecklistStatus;
  proofOfIncome: DocumentChecklistStatus;
  noticeOfAssessment: DocumentChecklistStatus;
  housingDocuments: DocumentChecklistStatus;
  medicalDocuments: DocumentChecklistStatus;
  legalDocuments: DocumentChecklistStatus;
  other: DocumentChecklistStatus;
  updatedAt: string;
}
