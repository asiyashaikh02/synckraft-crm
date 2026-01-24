
import { doc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Customer, CustomerStatus, ExecutionStage, Lead } from "../types";

export const convertLeadToCustomer = async (lead: Lead) => {
  const batch = writeBatch(db);
  const customerId = `cust_${lead.id}`;
  
  const customerData: Customer = {
    id: customerId,
    leadId: lead.id,
    companyName: lead.companyName,
    salesUserId: lead.salesUserId,
    salesUniqueId: (lead as any).salesUniqueId || undefined,
    clientCode: (lead as any).clientCode || undefined,
    status: CustomerStatus.INACTIVE,
    isLocked: false,
    createdAt: Date.now(),
    executionStage: ExecutionStage.PLANNING,
    internalCost: 0,
    billingAmount: lead.potentialValue
  };

  batch.set(doc(db, "customers", customerId), customerData);
  batch.delete(doc(db, "leads", lead.id));
  
  await batch.commit();
};

export const activateCustomer = async (id: string) => {
  await updateDoc(doc(db, "customers", id), {
    status: CustomerStatus.ACTIVE,
    isLocked: true,
    activatedAt: Date.now()
  });
};

export const updateOpsMetrics = async (id: string, stage: ExecutionStage, cost: number) => {
  await updateDoc(doc(db, "customers", id), {
    executionStage: stage,
    internalCost: cost
  });
};

export const updateCustomerAssignment = async (customerId: string, salesUserId: string, salesUniqueId?: string, clientCode?: string) => {
  await updateDoc(doc(db, 'customers', customerId), {
    salesUserId,
    salesUniqueId: salesUniqueId || null,
    clientCode: clientCode || salesUniqueId || null
  });
};
