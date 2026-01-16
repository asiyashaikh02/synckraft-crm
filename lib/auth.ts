
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserRole, UserStatus } from "../types";

/**
 * Registers a new user and creates their profile in Firestore.
 */
export const registerUser = async (email: string, pass: string, name: string, role: UserRole) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const profile = {
    uid: cred.user.uid,
    email,
    displayName: name,
    role,
    status: UserStatus.PENDING,
    createdAt: Date.now()
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  return profile;
};

/**
 * Logs in an existing user and fetches their profile.
 */
export const loginUser = async (email: string, pass: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  return snap.data();
};

/**
 * Signs the current user out.
 */
export const logoutUser = () => fbSignOut(auth);
