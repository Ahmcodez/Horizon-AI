/**
 * Horizon — Profile store
 * ------------------------
 * IMPORTANT SCOPE NOTE: this is a client-side-only persistence layer using
 * localStorage. It is NOT a real account system - there is no server, no
 * auth, and data does not sync across devices or survive a cleared browser.
 *
 * It's built this way deliberately, as a "repository" with a narrow
 * interface (getProfile / saveProfile / clearProfile), so that swapping the
 * implementation for real backend calls later (once accounts/auth exist)
 * only requires changing this one file - nothing in the UI needs to know
 * where the data actually lives.
 */

export interface HorizonProfile {
  birthYear: number;
  pia: number;
  maritalStatus: 'single' | 'married' | 'widowed';
  hasNonCoveredPension: boolean;
  onboardingCompletedAt: string | null; // ISO timestamp, null until onboarding finishes
}

const STORAGE_KEY = 'horizon:profile:v1';

export const DEFAULT_PROFILE: HorizonProfile = {
  birthYear: 1965,
  pia: 2200,
  maritalStatus: 'single',
  hasNonCoveredPension: false,
  onboardingCompletedAt: null,
};

export function getProfile(): HorizonProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    // Corrupted or inaccessible storage (e.g. private browsing) - fall back
    // to defaults rather than crashing the app.
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: Partial<HorizonProfile>): HorizonProfile {
  const current = getProfile();
  const next = { ...current, ...profile };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable - fail silently, in-memory state in the UI
    // still works for the current session.
  }
  return next;
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasCompletedOnboarding(): boolean {
  return getProfile().onboardingCompletedAt !== null;
}
