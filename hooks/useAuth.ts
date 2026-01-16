
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";

/**
 * Hook to manage and provide current authentication state and user profile.
 */
export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Fetch profile data from Firestore on successful auth
        const unsub = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
          setUser(snap.data() as UserProfile);
          setLoading(false);
        });
        return unsub;
      } else {
        setUser(null);
        setLoading(false);
      }
    });
  }, []);

  return { user, loading };
}
