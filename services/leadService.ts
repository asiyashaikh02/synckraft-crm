
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Lead, LeadStatus } from "../types";

const genLeadCode = () => 'LEAD-' + Math.floor(100000 + Math.random() * 900000).toString();

export const createLead = async (data: Partial<Lead>, uid: string, salesUniqueId?: string, clientCode?: string) => {
  return addDoc(collection(db, "leads"), {
    ...data,
    salesUserId: uid,
    salesUniqueId: salesUniqueId || null,
    clientCode: clientCode || salesUniqueId || genLeadCode(),
    status: LeadStatus.NEW,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
};

export const updateLeadStatus = async (id: string, status: LeadStatus) => {
  await updateDoc(doc(db, "leads", id), { 
    status, 
    updatedAt: Date.now() 
  });
};

export const deleteLead = async (id: string) => {
  await deleteDoc(doc(db, "leads", id));
};

export const updateLeadAssignment = async (leadId: string, salesUserId: string, salesUniqueId?: string, clientCode?: string) => {
  await updateDoc(doc(db, 'leads', leadId), {
    salesUserId,
    salesUniqueId: salesUniqueId || null,
    clientCode: clientCode || salesUniqueId || null,
    updatedAt: Date.now()
  });
};
