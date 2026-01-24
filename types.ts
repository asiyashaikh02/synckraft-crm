/* =========================
   USER & AUTH
========================= */

export enum UserRole {
  MASTER_ADMIN = "MASTER_ADMIN",
  SALES = "SALES",
  OPERATIONS = "OPERATIONS",
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
  NEGOTIATION = "NEGOTIATION", // discussion / pricing
  APPROVED = "APPROVED",       // approved → convert to customer
  REJECTED = "REJECTED",
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
  potentialValue: number;
  createdAt: number;
  updatedAt: number;
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
