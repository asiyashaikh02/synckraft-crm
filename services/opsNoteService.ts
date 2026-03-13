import { addDoc, collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { OpsNote } from "../types";

const OPS_NOTES_COLLECTION = "operations_notes";

export const addOpsNote = async (projectId: string, userId: string, note: string) => {
  const payload = {
    projectId,
    userId,
    note,
    createdAt: Date.now(),
  };
  return addDoc(collection(db, OPS_NOTES_COLLECTION), payload);
};

export const subscribeToOpsNotes = (
  projectId: string,
  callback: (notes: OpsNote[]) => void
) => {
  const q = query(
    collection(db, OPS_NOTES_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const rows: OpsNote[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as OpsNote[];
    callback(rows);
  });
};

