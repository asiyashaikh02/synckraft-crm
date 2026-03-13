/* =========================
   USER & AUTH
========================= */

export enum UserRole {
  MASTER_ADMIN = "MASTER_ADMIN",
  SALES_ADMIN = "SALES_ADMIN",
  SALES_USER = "SALES_USER",
  OPS_USER = "OPS_USER",
}

export enum UserStatus {
  PENDING = "PENDING",      // waiting for admin approval
  ACTIVE = "ACTIVE",        // approved & can use system
  REJECTED = "REJECTED",    // blocked
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
}

/* =========================
   LEADS (Sales)
========================= */

export enum LeadStatus {
  NEW = "NEW",                 // freshly created
  CONTACTED = "CONTACTED",     // contacted
  NEGOTIATION = "NEGOTIATION", // discussion / pricing
  CONTRACTED = "CONTRACTED",   // agreed terms
  APPROVED = "APPROVED",       // approved → convert to customer
  CONVERTED = "CONVERTED",     // successfully converted to customer
  REJECTED = "REJECTED",
  LOST = "LOST"                // discontinued
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: LeadStatus;
  salesUserId: string;
  salesUniqueId?: string; // links to profiles.uniqueId for integrity
  clientCode?: string; // client-specific code shown on leads
  city?: string; // e.g. "Mumbai", "Delhi"
  // --- AI Scoring Inputs ---
  monthlyUnits?: number;
  roofType?: string; // e.g. "RCC", "Sheet", etc.
  followUpCount?: number;
  visitCount?: number;
  responseTimeMinutes?: number;

  // --- AI Scoring Outputs ---
  aiScore?: number; // 0-100 score
  aiCategory?: "HOT" | "WARM" | "COLD";

  // --- Automation Fields ---
  lastFollowUpAt?: number;
  potentialValue: number;
  createdAt: number;
  updatedAt: number;
}

/* =========================
   NOTES & FOLLOW UPS
========================= */

export interface Note {
  id: string;
  leadId: string;
  userId: string;
  note: string;
  createdAt: number;
}

export enum FollowUpStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  MISSED = "MISSED",
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName?: string;
  userId: string;
  followUpDate: number;
  reminderNote: string;
  status: FollowUpStatus;
  createdAt: number;
}

/* =========================
   TASKS
========================= */

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  relatedLeadId?: string;
  dueDate: number;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
}

/* =========================
   SOLAR PROPOSAL
========================= */

export interface SolarProposal {
  id: string;
  leadId: string;
  panelCount: number;
  panelSizeKw: number;
  proposalAmount: number;
  finalAmount: number;
  roofArea: number;
}

/* =========================
   ACTIVITY LOGS
========================= */

export enum ActivityType {
  CALL = "CALL",
  SITE_VISIT = "SITE_VISIT",
  FOLLOW_UP = "FOLLOW_UP",
  STATUS_CHANGE = "STATUS_CHANGE",
  NOTE_ADDED = "NOTE_ADDED",
  PROPOSAL_GENERATED = "PROPOSAL_GENERATED",

  // OPS (post-sales execution)
  SITE_VISIT_STATUS_CHANGED = "SITE_VISIT_STATUS_CHANGED",
  PROPOSAL_STATUS_CHANGED = "PROPOSAL_STATUS_CHANGED",
  INSTALLATION_STAGE_CHANGED = "INSTALLATION_STAGE_CHANGED",
  TESTING_COMPLETED = "TESTING_COMPLETED",
  PROJECT_DELIVERED = "PROJECT_DELIVERED"
}

export interface ActivityLog {
  id: string;
  userId: string;       // ID of the user who performed the activity
  leadId?: string;      // Related lead (optional)
  customerId?: string;  // Related customer (optional)
  type: ActivityType;
  description: string;
  createdAt: number;
}

/* =========================
   CUSTOMERS (Post-Sales)
========================= */

export enum CustomerStatus {
  INACTIVE = "INACTIVE",   // 72-hour buffer
  ACTIVE = "ACTIVE",       // confirmed customer
  DELETED = "DELETED",     // dropped
}

export enum ExecutionStage {
  PLANNING = "PLANNING",
  EXECUTION = "EXECUTION",
  DELIVERED = "DELIVERED",
}

export interface Customer {
  id: string;
  leadId: string;
  companyName: string;
  salesUserId: string;
  salesUniqueId?: string;
  clientCode?: string;
  status: CustomerStatus;
  isLocked: boolean;              // after 72 hours
  executionStage: ExecutionStage;
  internalCost: number;
  billingAmount: number;
  createdAt: number;
  activatedAt?: number;
}

/* =========================
   OPS (Post-Sales Execution)
========================= */

export type OpsVisitStatus = "scheduled" | "completed" | "rescheduled" | "cancelled";
export type OpsProposalStatus = "draft" | "sent" | "approved" | "rejected";
export type InstallationStage = "planning" | "material_dispatch" | "installation" | "testing" | "completed";

export interface OpsNote {
  id: string;
  projectId: string;
  note: string;
  createdAt: number;
  userId: string;
}
