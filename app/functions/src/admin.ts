import * as admin from 'firebase-admin';

// Guard against re-initializing when multiple function files import this
// module (Firebase can bundle them into the same runtime instance).
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const db = admin.firestore();
