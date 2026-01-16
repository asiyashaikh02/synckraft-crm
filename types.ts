
export enum UserRole {
  MASTER_ADMIN = 'MASTER_ADMIN',
  SALES = 'SALES',
  OPERATIONS = 'OPERATIONS'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum LeadStatus {
  NEW = 'NEW',
  NEGOTIATION = 'NEGOTIATION',
  APPROVED = 'APPROVED'
}

export enum CustomerStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED'
}

export enum ExecutionStage {
  PLANNING = 'PLANNING',
  EXECUTION = 'EXECUTION',
  DELIVERED = 'DELIVERED'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: LeadStatus;
  salesUserId: string;
  potentialValue: number;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: string;
  leadId: string;
  companyName: string;
  salesUserId: string;
  status: CustomerStatus;
  isLocked: boolean;
  createdAt: number;
  activatedAt?: number;
  executionStage: ExecutionStage;
  internalCost: number;
  billingAmount: number;
}
