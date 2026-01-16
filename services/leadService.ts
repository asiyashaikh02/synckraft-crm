
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Lead, LeadStatus } from "../types";

export const createLead = async (data: Partial<Lead>, uid: string) => {
  return addDoc(collection(db, "leads"), {
    ...data,
    salesUserId: uid,
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
