export type Role = 'Caseworker' | 'SSA' | 'Manager' | 'Admin';

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
  lastLoginAt: string;
}

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
  status: 'Intake' | 'Active' | 'Follow-Up Needed' | 'Housed' | 'Discharged' | 'Inactive';
  priority: 'Low' | 'Medium' | 'High';
  currentGoal?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseNote {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  authorId: string;
  contactDate: string;
  contactType: string;
  category: string;
  location?: string;
  rawInput?: string;
  finalNote: string;
  aiGenerated: boolean;
  supervisorReviewed: boolean;
  supervisorReviewId?: string;
  riskMentioned: boolean;
  followUpRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  organizationId: string;
  siteId: string;
  clientId: string;
  assignedToId: string;
  createdById: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  completedAt?: string;
  createdAt: string;
}

// Add more models as needed...
