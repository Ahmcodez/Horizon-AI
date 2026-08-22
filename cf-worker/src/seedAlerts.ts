import { createFirestoreClient } from './firestore'
import type { ServiceAccount } from './googleAuth'

interface SeedAlertsConfig {
  serviceAccount: ServiceAccount
  firebaseProjectId: string
}

const SAMPLE_ALERTS = [
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
]

// Dev/testing utility - lets a signed-in user preview the Alerts page with
// realistic sample data instead of waiting for a real rule change. Same
// data and behavior as the dormant seedSampleAlerts Cloud Function.
export async function handleSeedAlerts(uid: string, config: SeedAlertsConfig): Promise<{ seeded: number }> {
  const firestore = createFirestoreClient(config.serviceAccount, config.firebaseProjectId)
  const now = Date.now()

  for (const sample of SAMPLE_ALERTS) {
    await firestore.createDocument(`profiles/${uid}/alerts`, {
      updateId: 'sample-seed',
      message: sample.message,
      createdAt: now - sample.daysAgo * 24 * 60 * 60 * 1000,
      read: false,
    })
  }

  return { seeded: SAMPLE_ALERTS.length }
}
