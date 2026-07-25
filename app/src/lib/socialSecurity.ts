/**
 * Horizon — Social Security Calculation Engine
 * ------------------------------------------------
 * This module is the single source of truth for every benefit number shown
 * in the app. It is intentionally deterministic and dependency-free:
 * given the same inputs, it always returns the same outputs, and it can be
 * unit-tested in isolation from any UI or AI code.
 *
 * Per the PRD's "AI Feature Architecture" principle: the AI assistant may
 * EXPLAIN these numbers in natural language, but it must never generate
 * them itself. All benefit math lives here.
 *
 * Formulas are based on published SSA rules (as of 2026):
 *  - Full Retirement Age (FRA) table: https://www.ssa.gov/benefits/retirement/planner/agereduction.html
 *  - Early claiming reduction: 5/9 of 1% per month for the first 36 months
 *    before FRA, then 5/12 of 1% per month beyond that.
 *  - Delayed retirement credits: 2/3 of 1% per month (8%/year) from FRA to 70.
 *
 * NOTE ON SCOPE (Phase 2): this engine takes the user's Primary Insurance
 * Amount (PIA) — the "your benefit at full retirement age" figure already
 * printed on every SSA statement — as an input, rather than recomputing it
 * from a full 35-year earnings history via the AIME/bend-point formula.
 * This is deliberate: it's the same number SSA already gives users, it's
 * more accurate than a from-scratch estimate, and it unblocks the OCR
 * "photograph your SSA statement" intake flow from the PRD. Full AIME
 * calculation from raw earnings history is a natural Phase-3 enhancement
 * for users who don't have a statement handy.
 */

export interface FullRetirementAge {
  years: number;
  months: number;
  totalMonths: number;
}

/**
 * Returns full retirement age for a given birth year, per SSA's official table.
 * Anyone born in 1960 or later has an FRA of 67 — the phase-in completed in 2026.
 */
export function getFullRetirementAge(birthYear: number): FullRetirementAge {
  const table: Record<number, [number, number]> = {
    1937: [65, 0], 1938: [65, 2], 1939: [65, 4], 1940: [65, 6],
    1941: [65, 8], 1942: [65, 10],
    1943: [66, 0], 1944: [66, 0], 1945: [66, 0], 1946: [66, 0],
    1947: [66, 0], 1948: [66, 0], 1949: [66, 0], 1950: [66, 0],
    1951: [66, 0], 1952: [66, 0], 1953: [66, 0], 1954: [66, 0],
    1955: [66, 2], 1956: [66, 4], 1957: [66, 6], 1958: [66, 8], 1959: [66, 10],
  };

  if (birthYear >= 1960) return toFRA(67, 0);
  if (birthYear <= 1937) return toFRA(65, 0);
  const [y, m] = table[birthYear] ?? [67, 0];
  return toFRA(y, m);
}

function toFRA(years: number, months: number): FullRetirementAge {
  return { years, months, totalMonths: years * 12 + months };
}

/** Converts a whole-number claiming age (e.g. 62, 67, 70) into total months from birth. */
export function ageToMonths(age: number): number {
  return Math.round(age * 12);
}

/**
 * Core calculation: given a Primary Insurance Amount (PIA) and full retirement
 * age, returns the monthly benefit for claiming at `claimAgeMonths`.
 *
 * claimAgeMonths must be between 62*12 (earliest claiming age) and 70*12
 * (latest age credits accrue).
 */
export function calculateMonthlyBenefit(
  pia: number,
  fra: FullRetirementAge,
  claimAgeMonths: number
): number {
  const minMonths = 62 * 12;
  const maxMonths = 70 * 12;
  const clamped = Math.min(Math.max(claimAgeMonths, minMonths), maxMonths);

  if (clamped < fra.totalMonths) {
    // Claiming early: apply reduction
    const monthsEarly = fra.totalMonths - clamped;
    const first36 = Math.min(monthsEarly, 36);
    const beyond36 = Math.max(monthsEarly - 36, 0);
    const reductionPct = first36 * (5 / 9) + beyond36 * (5 / 12); // percentage points
    return round2(pia * (1 - reductionPct / 100));
  }

  if (clamped > fra.totalMonths) {
    // Claiming late: apply delayed retirement credits
    const monthsDelayed = clamped - fra.totalMonths;
    const increasePct = monthsDelayed * (2 / 3); // percentage points
    return round2(pia * (1 + increasePct / 100));
  }

  return round2(pia);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface ClaimingScenario {
  age: number;
  monthlyBenefit: number;
  annualBenefit: number;
  vsFraPct: number; // percent difference from claiming exactly at FRA
}

/**
 * Generates the full claiming-age comparison used throughout the app:
 * one row per whole-number age from 62 to 70.
 */
export function generateClaimingComparison(
  pia: number,
  birthYear: number
): ClaimingScenario[] {
  const fra = getFullRetirementAge(birthYear);
  const fraBenefit = calculateMonthlyBenefit(pia, fra, fra.totalMonths);

  const ages: number[] = [];
  for (let age = 62; age <= 70; age++) ages.push(age);

  return ages.map((age) => {
    const monthly = calculateMonthlyBenefit(pia, fra, ageToMonths(age));
    return {
      age,
      monthlyBenefit: monthly,
      annualBenefit: round2(monthly * 12),
      vsFraPct: round2(((monthly - fraBenefit) / fraBenefit) * 100),
    };
  });
}

/**
 * Breakeven analysis: the age at which cumulative lifetime benefits from
 * claiming at `laterAge` overtake cumulative benefits from claiming at
 * `earlierAge`. Returns null if they never cross by age 95 (rare, but
 * mathematically possible with small gaps).
 */
export function calculateBreakevenAge(
  pia: number,
  birthYear: number,
  earlierAge: number,
  laterAge: number
): number | null {
  const fra = getFullRetirementAge(birthYear);
  const earlierMonthly = calculateMonthlyBenefit(pia, fra, ageToMonths(earlierAge));
  const laterMonthly = calculateMonthlyBenefit(pia, fra, ageToMonths(laterAge));

  for (let currentAge = laterAge; currentAge <= 95; currentAge += 1 / 12) {
    const monthsReceivingEarlier = (currentAge - earlierAge) * 12;
    const monthsReceivingLater = (currentAge - laterAge) * 12;
    const earlierTotal = earlierMonthly * monthsReceivingEarlier;
    const laterTotal = laterMonthly * monthsReceivingLater;
    if (laterTotal >= earlierTotal) {
      return round2(currentAge * 100) / 100;
    }
  }
  return null;
}

/**
 * Spousal benefit: up to 50% of the higher earner's PIA, reduced if the
 * spouse claims before their own full retirement age. This is a simplified
 * version — it does not yet implement deemed filing edge cases or the
 * "restricted application" rules that only apply to people born before 1954.
 */
export function calculateSpousalBenefit(
  higherEarnerPia: number,
  spouseFra: FullRetirementAge,
  spouseClaimAgeMonths: number
): number {
  const maxSpousalBenefit = higherEarnerPia * 0.5;
  const minMonths = 62 * 12;
  const clamped = Math.max(spouseClaimAgeMonths, minMonths);

  if (clamped >= spouseFra.totalMonths) {
    return round2(maxSpousalBenefit);
  }

  // Spousal reduction: 25/36 of 1% per month for first 36 months early,
  // then 5/12 of 1% per month beyond that (different rate than retirement benefit).
  const monthsEarly = spouseFra.totalMonths - clamped;
  const first36 = Math.min(monthsEarly, 36);
  const beyond36 = Math.max(monthsEarly - 36, 0);
  const reductionPct = first36 * (25 / 36) + beyond36 * (5 / 12);
  return round2(maxSpousalBenefit * (1 - reductionPct / 100));
}

/** Applies the 2026 cost-of-living adjustment (2.8%) to a benefit amount. */
export const COLA_2026 = 0.028;
export function applyCola(amount: number, colaRate: number = COLA_2026): number {
  return round2(amount * (1 + colaRate));
}

/**
 * Annual earnings test (2026 figures) for people who claim before FRA and
 * continue working. Returns the amount withheld from annual benefits.
 */
export const EARNINGS_LIMIT_UNDER_FRA_2026 = 24_480;
export const EARNINGS_LIMIT_YEAR_OF_FRA_2026 = 65_160; // more generous limit in the year FRA is reached

export function calculateEarningsWithholding(
  annualEarnings: number,
  isYearOfFra: boolean
): number {
  const limit = isYearOfFra ? EARNINGS_LIMIT_YEAR_OF_FRA_2026 : EARNINGS_LIMIT_UNDER_FRA_2026;
  const withholdRatio = isYearOfFra ? 1 / 3 : 1 / 2; // $1 per $3 over limit in FRA year, $1 per $2 otherwise
  if (annualEarnings <= limit) return 0;
  return round2((annualEarnings - limit) * withholdRatio);
}
