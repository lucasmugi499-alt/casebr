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

export type ClientStatus = 'intake' | 'active' | 'follow_up_needed' | 'housed' | 'discharged' | 'inactive';
export type Priority = 'low' | 'medium' | 'high';

export interface Client {
  id: string;
  organizationId: string;
  siteId: string;
  displayName: string;
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
  | 'housing_support';

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
  | 'system_navigation';

export interface CaseNote {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  authorId: string;
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

export interface Referral {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  createdById: string;
  referralType: string;
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
  reviewType: 'case_note' | 'risk_flag' | 'safety_plan' | 'general';
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
  type: 'case_note' | 'task' | 'referral' | 'risk_flag' | 'safety_plan' | 'supervisor_review';
  date: string;
  title: string;
  summary: string;
  staffId: string;
  staffName?: string;
  entityId: string;
  entityType: string;
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
}
