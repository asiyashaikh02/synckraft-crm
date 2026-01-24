import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserRole, UserStatus } from "../types";

// 🔐 Only this email becomes MASTER_ADMIN automatically
const MASTER_ADMIN_EMAIL = "synckraft.me@gmail.com";

/**
 * Register new user
 */export const registerUser = async (
  email: string,
  pass: string,
  name: string,
  selectedRole: UserRole
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);

  const isMasterAdmin = email === MASTER_ADMIN_EMAIL;

  const profile = {
    uid: cred.user.uid,
    email,
    displayName: name,
    role: isMasterAdmin ? UserRole.MASTER_ADMIN : selectedRole,
    status: isMasterAdmin ? UserStatus.ACTIVE : UserStatus.PENDING,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, "users", cred.user.uid), profile);
  return profile;
};

// export const registerUser = async (
//   email: string,
//   pass: string,
//   name: string,
//   role: UserRole
// ) => {
//   const cred = await createUserWithEmailAndPassword(auth, email, pass);

//   const isMasterAdmin = email === MASTER_ADMIN_EMAIL;

//   const profile = {
//     uid: cred.user.uid,
//     email,
//     displayName: name,
//     role: isMasterAdmin ? UserRole.MASTER_ADMIN : role,
//     status: isMasterAdmin ? UserStatus.ACTIVE : UserStatus.PENDING,
//     createdAt: Date.now(),
//   };

//   await setDoc(doc(db, "users", cred.user.uid), profile);
//   return profile;
// };

/**
 * Login user
 * - Auto-creates Firestore profile if missing
 * - Blocks non-approved users
 */
export const loginUser = async (email: string, pass: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  // 🔥 AUTO-HEAL: profile missing
  if (!snap.exists()) {
    const isMasterAdmin = email === MASTER_ADMIN_EMAIL;
    const profile = {
      uid,
      email,
      displayName: cred.user.displayName || "",
      role: isMasterAdmin ? UserRole.MASTER_ADMIN : UserRole.SALES,
      status: isMasterAdmin ? UserStatus.ACTIVE : UserStatus.PENDING,
      createdAt: Date.now(),
    };

    await setDoc(ref, profile);

    if (!isMasterAdmin) {
      throw new Error("Account Pending Approval");
    }

    return profile;
  }

  const data = snap.data();

  if (data.status !== UserStatus.ACTIVE) {
    throw new Error("Account Pending Approval");
  }

  return data;
};

/**
 * Logout
 */
export const logoutUser = async () => {
  await fbSignOut(auth);
};
