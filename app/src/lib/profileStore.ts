/**
 * Horizon — Profile store (Firestore-backed)
 * --------------------------------------------
 * Replaces the Phase 4 localStorage version now that real accounts exist.
 * Each user's profile lives at profiles/{uid} in Firestore, readable and
 * writable only by that user (see firestore.rules).
 *
 * Every function here is async and requires a uid — there is no anonymous
 * fallback in this version. Screens that need profile data should only
 * render once useAuth() has resolved to a signed-in user.
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface HorizonProfile {
  birthYear: number
  pia: number
  maritalStatus: 'single' | 'married' | 'widowed'
  hasNonCoveredPension: boolean
  onboardingCompletedAt: string | null // ISO timestamp, null until onboarding finishes
}

export const DEFAULT_PROFILE: HorizonProfile = {
  birthYear: 1965,
  pia: 2200,
  maritalStatus: 'single',
  hasNonCoveredPension: false,
  onboardingCompletedAt: null,
}

function profileRef(uid: string) {
  return doc(db, 'profiles', uid)
}

export async function getProfile(uid: string): Promise<HorizonProfile> {
  const snap = await getDoc(profileRef(uid))
  if (!snap.exists()) return DEFAULT_PROFILE
  return { ...DEFAULT_PROFILE, ...(snap.data() as Partial<HorizonProfile>) }
}

export async function saveProfile(
  uid: string,
  profile: Partial<HorizonProfile>
): Promise<void> {
  await setDoc(profileRef(uid), profile, { merge: true })
}

export async function clearProfile(uid: string): Promise<void> {
  await deleteDoc(profileRef(uid))
}

export async function hasCompletedOnboarding(uid: string): Promise<boolean> {
  const profile = await getProfile(uid)
  return profile.onboardingCompletedAt !== null
}
