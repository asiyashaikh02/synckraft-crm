
/**
 * SYNCKRAFT CRM - Cloud Functions (Stage 2)
 * 
 * Logic: Automated 72-hour cleanup for INACTIVE customers.
 * Why: To maintain data integrity and enforce the business rule that Sales must 
 * decide within 72h to activate or lose a converted lead.
 */

import * as functions from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

// Initialize Admin SDK
initializeApp();

/**
 * Scheduled function running every hour to check for expired INACTIVE customers.
 * 72 hours = 259,200,000 milliseconds.
 */
export const cleanupInactiveCustomers = functions.scheduler.onSchedule("0 * * * *", async (event) => {
  const db = getFirestore();
  const seventyTwoHoursInMs = 72 * 60 * 60 * 1000;
  const expirationThreshold = Date.now() - seventyTwoHoursInMs;

  console.log(`Running cleanup. Searching for customers INACTIVE created before: ${new Date(expirationThreshold).toISOString()}`);

  try {
    // 1. Fetch all INACTIVE customers created more than 72 hours ago
    const snapshot = await db.collection("customers")
      .where("status", "==", "INACTIVE")
      .where("createdAt", "<=", expirationThreshold)
      .get();

    if (snapshot.empty) {
      console.log("No expired inactive customers found.");
      return;
    }

    // 2. Use a write batch for efficient multi-document updates (atomic)
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      console.log(`Marking customer ${doc.id} as DELETED due to 72h expiry.`);
      batch.update(doc.ref, {
        status: "DELETED",
        updatedAt: FieldValue.serverTimestamp(),
        deletionMetaData: {
          reason: "72H_EXPIRY_AUTO_CLEANUP",
          processedAt: FieldValue.serverTimestamp()
        }
      });
    });

    // 3. Commit the batch
    await batch.commit();
    console.log(`Successfully cleaned up ${snapshot.size} customers.`);
  } catch (error) {
    console.error("Cleanup Execution Error:", error);
  }
});

/**
 * Alternative: Task Queue Approach (Triggered on Creation)
 * This is more precise (runs exactly at 72h) but requires more setup.
 * For an MVP, the Scheduled function above is often preferred for simplicity.
 */
