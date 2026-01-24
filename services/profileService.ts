import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

/**
 * Read a profile document by a full document path (e.g. "profiles/<id>")
 */
export async function getProfileByPath(path: string) {
  if (!path) return null;
  const parts = path.split('/');
  if (parts.length !== 2) return null;
  const [, id] = parts;
  const snap = await getDoc(doc(db, 'profiles', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Query profile by userId (userRef field links back to users/<uid>)
 */
export async function getProfileByUserId(userId: string) {
  const q = query(collection(db, 'profiles'), where('userRef', '==', `users/${userId}`));
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Subscribe to a profile document for real-time updates. Returns unsubscribe.
 */
export function subscribeToProfile(profileId: string, cb: (data: any) => void) {
  return onSnapshot(doc(db, 'profiles', profileId), s => {
    cb(s.exists() ? { id: s.id, ...s.data() } : null);
  });
}

/**
 * Update profile fields (partial update)
 */
export async function updateProfile(profileId: string, data: Record<string, any>) {
  await updateDoc(doc(db, 'profiles', profileId), data as any);
}
