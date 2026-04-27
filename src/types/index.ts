export type Role = 'caseworker' | 'ssa' | 'manager' | 'admin';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  siteIds: string[];
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  title: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

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
  currentGoal?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export type ContactType = 'in_person' | 'phone' | 'email' | 'outreach' | 'appointment_accompaniment' | 'case_conference' | 'crisis_support' | 'informal_check_in' | 'referral_support' | 'housing_support';
export type NoteCategory = 'general_check_in' | 'housing' | 'income_support' | 'identification' | 'mental_health' | 'substance_use' | 'safety_planning' | 'medical_health' | 'employment' | 'legal' | 'family_supports' | 'behavioural_incident_follow_up' | 'discharge_planning' | 'system_navigation';

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
  rawInput?: string;
  finalNote: string;
  actionsTaken?: string;
  referralsMade?: string;
  aiGenerated: boolean;
  supervisorReviewed: boolean;
  supervisorReviewId?: string;
  riskMentioned: boolean;
  followUpRequired: boolean;
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
  description?: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReferralType = 'housing' | 'income_support' | 'id_replacement' | 'mental_health' | 'substance_use_support' | 'medical' | 'employment' | 'legal' | 'food_clothing' | 'other';
export type ReferralStatus = 'pending' | 'completed' | 'declined' | 'no_response' | 'cancelled';

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

export type RiskCategory = 'mental_health' | 'substance_use' | 'conflict_safety' | 'medical' | 'vulnerability' | 'housing_instability' | 'missing_lost_contact' | 'other';

export interface RiskFlag {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  createdById: string;
  category: RiskCategory;
  severity: Priority;
  description: string;
  active: boolean;
  supervisorReviewRequired: boolean;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SafetyPlanStatus = 'active' | 'review_due' | 'closed';

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
  status: SafetyPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupervisorReview {
  id: string;
  organizationId: string;
  siteId: string;
  entityId: string; // ID of the note, risk flag, etc.
  entityType: 'case_note' | 'risk_flag' | 'safety_plan';
  supervisorId: string;
  comments: string;
  actionRequired: boolean;
  resolved: boolean;
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
  metadata?: any;
}

export type TimelineItemType = 'case_note' | 'task' | 'referral' | 'risk_flag' | 'safety_plan' | 'supervisor_review' | 'status_change';

export interface TimelineItem {
  id: string;
  date: string;
  type: TimelineItemType;
  staffName: string;
  summary: string;
  detailsId: string; // The ID to the actual record
  priority?: Priority;
  aiGenerated?: boolean;
}

export interface OutcomeMetric {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  createdById: string;
  category: string;
  dateAchieved: string;
  notes?: string;
}

export interface Report {
  id: string;
  organizationId: string;
  generatedById: string;
  type: 'weekly_team' | 'monthly_program' | 'client_summary' | 'caseworker_activity';
  dateRangeStart: string;
  dateRangeEnd: string;
  filters?: any;
  downloadUrl?: string;
  createdAt: string;
}
