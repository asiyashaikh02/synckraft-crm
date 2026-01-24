/**
 * Simple integration script to simulate:
 * 1) Create a PENDING user document (simulating a registered user)
 * 2) Create a lead assigned to that user's uid (pre-approval)
 * 3) Create a profile document and mark user ACTIVE (simulate admin approval)
 * 4) Backfill leads/customers so they pick up profile.uniqueId
 *
 * NOTE: This script uses the Firebase Admin SDK and requires a service account JSON file.
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
 *   node ./scripts/backfill_test.js
 */

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON');
  process.exit(1);
}

admin.initializeApp();
const db = admin.firestore();

async function run() {
  // create a fake user doc
  const userRef = db.collection('users').doc();
  const userId = userRef.id;
  await userRef.set({ email: 'preapproval@example.com', name: 'Pre Approval', role: 'SALES', status: 'PENDING', createdAt: Date.now() });
  console.log('Created user', userId);

  // create a lead assigned to that uid
  const leadRef = db.collection('leads').doc();
  await leadRef.set({ companyName: 'TestCo', contactPerson: 'Jane', email: 'jane@testco.com', phone: '123', salesUserId: userId, status: 'NEW', createdAt: Date.now(), updatedAt: Date.now(), clientCode: null });
  console.log('Created lead', leadRef.id);

  // Simulate admin approval: create profile and set user status ACTIVE
  const profilesCol = db.collection('profiles');
  const profileRef = profilesCol.doc();
  const uniqueId = 'UID-' + Math.floor(100000 + Math.random() * 900000).toString();
  await profileRef.set({ id: profileRef.id, name: 'Pre Approval', email: 'preapproval@example.com', contact: '', role: 'SALES', uniqueId, createdAt: Date.now(), userRef: `users/${userId}` });
  await userRef.update({ status: 'ACTIVE', profileRef: profileRef.path });
  console.log('Approved user and created profile with uniqueId', uniqueId);

  // Backfill existing leads for this user
  const leadsSnap = await db.collection('leads').where('salesUserId', '==', userId).get();
  for (const ld of leadsSnap.docs) {
    await ld.ref.update({ salesUniqueId: uniqueId, clientCode: uniqueId });
    console.log('Backfilled lead', ld.id);
  }

  // Backfill customers too
  const custSnap = await db.collection('customers').where('salesUserId', '==', userId).get();
  for (const c of custSnap.docs) {
    await c.ref.update({ salesUniqueId: uniqueId, clientCode: uniqueId });
    console.log('Backfilled customer', c.id);
  }

  console.log('Backfill complete. Verify via your app.');
}

run().catch(err => { console.error(err); process.exit(1); });
