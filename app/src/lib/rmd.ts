/**
 * Required Minimum Distribution (RMD) calculations.
 *
 * Source: IRS Publication 590-B, Appendix B, Table III (Uniform Lifetime
 * Table), effective January 1, 2022 under the SECURE 2.0 Act updates — still
 * the current table for 2026, unchanged since 2022. This is the table used
 * by the vast majority of account owners (anyone whose spouse is not both
 * (a) the sole beneficiary and (b) more than 10 years younger — those cases
 * use the Joint and Last Survivor Table instead, which this module does not
 * cover; inherited/beneficiary accounts use the Single Life Table, also not
 * covered here).
 *
 * RMD start age: 73 for anyone born 1951-1959, 75 for anyone born 1960 or
 * later (SECURE 2.0 Act).
 */

// age -> distribution period divisor
const UNIFORM_LIFETIME_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0,
  79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
  86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8,
  93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8,
  100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3,
  107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3, 113: 3.1,
  114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3,
}
const TOP_TABLE_AGE = 120 // ages 120+ all use 2.0
const TOP_TABLE_DIVISOR = 2.0

/** RMD start age by birth year, per SECURE 2.0. */
export function getRmdStartAge(birthYear: number): number {
  return birthYear >= 1960 ? 75 : 73
}

/**
 * Looks up the Uniform Lifetime Table divisor for a given age.
 * Returns null for ages below 72 (no RMD required) — callers should check
 * this before computing a distribution.
 */
export function getUniformLifetimeDivisor(age: number): number | null {
  if (age < 72) return null
  if (age >= TOP_TABLE_AGE) return TOP_TABLE_DIVISOR
  return UNIFORM_LIFETIME_TABLE[age] ?? null
}

export interface RmdResult {
  age: number
  divisor: number
  rmdAmount: number
  withdrawalRatePercent: number
}

/**
 * Calculates the RMD for one account for the given age, using the prior
 * year-end balance. Returns null if no RMD is required yet (under 72).
 */
export function calculateRmd(priorYearEndBalance: number, age: number): RmdResult | null {
  const divisor = getUniformLifetimeDivisor(age)
  if (divisor === null) return null
  const rmdAmount = round2(priorYearEndBalance / divisor)
  return {
    age,
    divisor,
    rmdAmount,
    withdrawalRatePercent: round2((rmdAmount / priorYearEndBalance) * 100),
  }
}

/**
 * Projects RMDs forward year by year from the current age through a target
 * end age, assuming a constant annual growth rate on the remaining balance
 * (applied AFTER each year's withdrawal) and no additional contributions.
 * This is a projection under stated assumptions, not a guarantee — actual
 * market returns will differ. Each year's own RMD amount, given that year's
 * balance, is exact; only the future balances feeding later years are
 * assumption-dependent.
 */
export interface RmdProjectionYear {
  age: number
  startingBalance: number
  rmdAmount: number
  endingBalance: number
}

export function projectRmdSchedule(
  currentBalance: number,
  currentAge: number,
  endAge: number,
  annualGrowthRatePercent: number = 0
): RmdProjectionYear[] {
  const schedule: RmdProjectionYear[] = []
  let balance = currentBalance
  const startAge = Math.max(currentAge, 72)

  for (let age = startAge; age <= endAge; age++) {
    const result = calculateRmd(balance, age)
    if (!result) continue
    const afterWithdrawal = balance - result.rmdAmount
    const endingBalance = round2(afterWithdrawal * (1 + annualGrowthRatePercent / 100))
    schedule.push({
      age,
      startingBalance: round2(balance),
      rmdAmount: result.rmdAmount,
      endingBalance,
    })
    balance = endingBalance
  }

  return schedule
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
