import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin';

/**
 * Dev/testing utility only - lets a signed-in user populate their own
 * alerts feed with realistic sample data, so the Alerts page (and the
 * navbar's unread badge) can be visually verified WITHOUT waiting for the
 * real checkRuleUpdates schedule to detect an actual live change.
 *
 * This does NOT prove the scraper itself works against the live SSA/IRS/CMS
 * pages - only that the display pipeline (Firestore -> real-time listener
 * -> Alerts page -> mark-read/dismiss) renders correctly end to end. The
 * scraper's own correctness can only be confirmed by deploying and checking
 * Cloud Functions logs / the ruleSources collection after a real run - see
 * docs/SECURITY.md and the comments in alerts.ts.
 *
 * A user can only ever seed alerts into THEIR OWN alerts subcollection -
 * never anyone else's - same auth check as every other function here.
 */
export const seedSampleAlerts = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }

  const sampleAlerts = [
    {
      message:
        'The 2026 cost-of-living adjustment (2.8%) has been applied to your estimated benefit. Your monthly deposit reflects this automatically starting January.',
      daysAgo: 21,
    },
    {
      message:
        'Medicare Part B premiums rose to $202.90/month for 2026 — a 9.7% increase from last year. This is deducted directly from your Social Security deposit.',
      daysAgo: 14,
    },
    {
      message:
        'The Social Security Fairness Act repeal of WEP/GPO is now fully in effect. If you have a non-covered pension, your benefit is no longer reduced for it.',
      daysAgo: 5,
    },
  ];

  const batch = db.batch();
  const now = Date.now();
  sampleAlerts.forEach((sample) => {
    const ref = db.collection('profiles').doc(request.auth!.uid).collection('alerts').doc();
    batch.set(ref, {
      updateId: 'sample-seed',
      message: sample.message,
      createdAt: now - sample.daysAgo * 24 * 60 * 60 * 1000,
      read: false,
    });
  });
  await batch.commit();

  return { seeded: sampleAlerts.length };
});
