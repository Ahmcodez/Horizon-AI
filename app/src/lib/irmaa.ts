/**
 * Medicare IRMAA (Income-Related Monthly Adjustment Amount) — 2026.
 *
 * Source: CMS's finalized 2026 Medicare Part B and Part D premium/IRMAA
 * amounts, published November 14, 2025, effective January 1, 2026.
 * Standard Part B premium: $202.90/month. IRMAA uses a 2-year MAGI lookback
 * (2026 premiums are based on 2024 MAGI) and is a cliff system — crossing a
 * threshold by even $1 triggers the FULL surcharge for that tier, not a
 * phase-in. The first four tiers are inflation-indexed annually; the top
 * tier ($500,000 single / $750,000 joint) is frozen by statute through at
 * least 2028.
 *
 * Married-filing-separately has a different, harsher bracket structure:
 * only two surcharge tiers (collapsed) instead of five, because the
 * standard MFJ inflation-adjusted tiers don't apply when a couple files
 * separately but lived together.
 */

export type IrmaaFilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately'

export const STANDARD_PART_B_PREMIUM_2026 = 202.9

interface IrmaaTier {
  /** MAGI threshold (from your 2-years-prior return) above which this tier applies. */
  magiAbove: number
  partBTotal: number
  partDSurcharge: number
}

// Ordered highest-threshold-first so callers can find the first tier the
// MAGI exceeds by iterating in order.
const SINGLE_TIERS: IrmaaTier[] = [
  { magiAbove: 500000, partBTotal: 689.9, partDSurcharge: 91.0 },
  { magiAbove: 205000, partBTotal: 649.2, partDSurcharge: 83.3 },
  { magiAbove: 171000, partBTotal: 527.5, partDSurcharge: 60.4 },
  { magiAbove: 137000, partBTotal: 405.8, partDSurcharge: 37.5 },
  { magiAbove: 109000, partBTotal: 284.1, partDSurcharge: 14.5 },
]

const MFJ_TIERS: IrmaaTier[] = [
  { magiAbove: 750000, partBTotal: 689.9, partDSurcharge: 91.0 },
  { magiAbove: 410000, partBTotal: 649.2, partDSurcharge: 83.3 },
  { magiAbove: 342000, partBTotal: 527.5, partDSurcharge: 60.4 },
  { magiAbove: 274000, partBTotal: 405.8, partDSurcharge: 37.5 },
  { magiAbove: 218000, partBTotal: 284.1, partDSurcharge: 14.5 },
]

// MFS (having lived with spouse at any point in the year) collapses to just
// two surcharge tiers.
const MFS_TIERS: IrmaaTier[] = [
  { magiAbove: 391000, partBTotal: 689.9, partDSurcharge: 91.0 },
  { magiAbove: 109000, partBTotal: 649.2, partDSurcharge: 83.3 },
]

export interface IrmaaResult {
  tierIndex: number // 0 = standard/no surcharge, 1-5 = surcharge tier (5 only reachable for single/MFJ)
  monthlyPartBTotal: number
  monthlyPartBSurcharge: number
  monthlyPartDSurcharge: number
  monthlyTotalSurcharge: number
  annualTotalSurcharge: number
}

/**
 * Looks up the 2026 IRMAA tier for a given MAGI and filing status. The MAGI
 * passed in should be from the return 2 years prior (your 2024 return for
 * 2026 premiums) — this function doesn't apply the lookback itself, since
 * the caller controls which year's income they're checking.
 */
export function calculateIrmaa(magi: number, filingStatus: IrmaaFilingStatus): IrmaaResult {
  const tiers =
    filingStatus === 'marriedFilingJointly'
      ? MFJ_TIERS
      : filingStatus === 'marriedFilingSeparately'
        ? MFS_TIERS
        : SINGLE_TIERS

  const matchedTier = tiers.find((tier) => magi > tier.magiAbove)

  if (!matchedTier) {
    return {
      tierIndex: 0,
      monthlyPartBTotal: STANDARD_PART_B_PREMIUM_2026,
      monthlyPartBSurcharge: 0,
      monthlyPartDSurcharge: 0,
      monthlyTotalSurcharge: 0,
      annualTotalSurcharge: 0,
    }
  }

  const partBSurcharge = round2(matchedTier.partBTotal - STANDARD_PART_B_PREMIUM_2026)
  const monthlyTotalSurcharge = round2(partBSurcharge + matchedTier.partDSurcharge)

  // tierIndex: position from the bottom of the filing status's own tier list
  const tierIndex = tiers.length - tiers.indexOf(matchedTier)

  return {
    tierIndex,
    monthlyPartBTotal: matchedTier.partBTotal,
    monthlyPartBSurcharge: partBSurcharge,
    monthlyPartDSurcharge: matchedTier.partDSurcharge,
    monthlyTotalSurcharge,
    annualTotalSurcharge: round2(monthlyTotalSurcharge * 12),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
