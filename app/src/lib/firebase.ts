import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * All Firebase config values come from environment variables — see
 * .env.example for the full list. None of these are secret in the way an
 * API key for a server-side service would be (Firebase's client config is
 * designed to be public and is protected instead by Firestore/Auth security
 * rules), but we still keep them out of source control as a matter of
 * hygiene and so different environments (dev/staging/prod) can point at
 * different Firebase projects without code changes.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missingKeys.length > 0) {
  // Fails loudly and early, at import time, rather than letting the app
  // boot into a broken auth/database state and fail confusingly later.
  console.error(
    `[Horizon] Missing Firebase config: ${missingKeys.join(', ')}. ` +
      `Copy .env.example to .env.local and fill in your Firebase project's values.`
  )
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
