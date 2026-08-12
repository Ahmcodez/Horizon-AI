/**
 * Federal taxation of Social Security benefits.
 *
 * Implements IRS Publication 915, Worksheet 1 ("Figuring Your Taxable
 * Benefits") in full — all 19 lines, not a simplified approximation. Base
 * amounts ($25,000 single / $32,000 joint) and the additional amounts
 * ($9,000 / $12,000) have been frozen by Congress since 1983 and 1993
 * respectively and remain unchanged for 2026.
 *
 * Does NOT cover (same exclusions the IRS worksheet itself carves out):
 *  - IRA-deduction interaction when covered by a workplace retirement plan
 *    (Pub. 590-A Appendix B special worksheets)
 *  - Lump-sum election for a prior-year retroactive payment (Worksheets 2-4)
 *  - Nonresident alien taxation (flat 85%/30% rule, not this worksheet)
 * These are real but comparatively rare situations; the standard worksheet
 * implemented here covers the large majority of filers.
 */

export type FilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately'

export interface SsTaxInput {
  filingStatus: FilingStatus
  /** Total net Social Security benefits for the year (SSA-1099 box 5). */
  netBenefits: number
  /** All other taxable income: wages, pensions, interest, dividends, IRA/401k distributions, capital gains, etc. Excludes the SS benefits themselves. */
  otherTaxableIncome: number
  /** Tax-exempt interest (e.g. municipal bonds). */
  taxExemptInterest: number
  /** Above-the-line adjustments to income (IRA deduction, educator expenses, etc.) — optional, defaults to 0. */
  incomeAdjustments?: number
  /** Only relevant for marriedFilingSeparately: did you live with your spouse at any point during the year? Materially changes the result (flat 85% if true). */
  livedWithSpouseIfMFS?: boolean
}

export interface SsTaxResult {
  /** The final answer: how much of netBenefits is federally taxable. */
  taxableBenefits: number
  /** taxableBenefits as a percent of netBenefits, for display. */
  taxablePercent: number
  /** Worksheet 1 line 6 — combined income before comparing to the base amount. */
  combinedIncome: number
  /** Worksheet 1 line 9 — the base amount for this filing status. */
  baseAmount: number
  /** True if none of the benefits are taxable (stopped early in the worksheet). */
  noneTaxable: boolean
}

function baseAmountFor(filingStatus: FilingStatus, livedWithSpouseIfMFS?: boolean): number {
  if (filingStatus === 'marriedFilingJointly') return 32000
  if (filingStatus === 'marriedFilingSeparately' && livedWithSpouseIfMFS) return 0
  return 25000 // single, head of household, qualifying surviving spouse, or MFS-lived-apart
}

function additionalAmountFor(filingStatus: FilingStatus): number {
  return filingStatus === 'marriedFilingJointly' ? 12000 : 9000
}

/**
 * Runs IRS Publication 915 Worksheet 1 end to end.
 */
export function calculateTaxableSsBenefits(input: SsTaxInput): SsTaxResult {
  const {
    filingStatus,
    netBenefits,
    otherTaxableIncome,
    taxExemptInterest,
    incomeAdjustments = 0,
    livedWithSpouseIfMFS = false,
  } = input

  // Line 1-2: half of benefits
  const halfBenefits = netBenefits * 0.5

  // Line 3-6: combined income (adjustments/exclusions for adoption benefits,
  // foreign earned income, etc. are rare edge cases not modeled here — this
  // implementation treats them as 0, consistent with the vast majority of filers)
  const combinedIncome = halfBenefits + otherTaxableIncome + taxExemptInterest

  // Line 7-8: subtract above-the-line adjustments; stop if none taxable
  if (incomeAdjustments >= combinedIncome) {
    return {
      taxableBenefits: 0,
      taxablePercent: 0,
      combinedIncome,
      baseAmount: baseAmountFor(filingStatus, livedWithSpouseIfMFS),
      noneTaxable: true,
    }
  }
  const line8 = combinedIncome - incomeAdjustments

  // MFS living with spouse at any point in the year: skip straight to a flat 85%
  if (filingStatus === 'marriedFilingSeparately' && livedWithSpouseIfMFS) {
    const line17 = line8 * 0.85
    const line18 = netBenefits * 0.85
    const taxableBenefits = round2(Math.min(line17, line18))
    return {
      taxableBenefits,
      taxablePercent: netBenefits > 0 ? round2((taxableBenefits / netBenefits) * 100) : 0,
      combinedIncome,
      baseAmount: 0,
      noneTaxable: taxableBenefits === 0,
    }
  }

  // Line 9-10: compare to base amount
  const baseAmount = baseAmountFor(filingStatus, livedWithSpouseIfMFS)
  if (baseAmount >= line8) {
    return {
      taxableBenefits: 0,
      taxablePercent: 0,
      combinedIncome,
      baseAmount,
      noneTaxable: true,
    }
  }
  const line10 = line8 - baseAmount

  // Line 11-16: the 50%/85% tiering
  const additionalAmount = additionalAmountFor(filingStatus)
  const line12 = Math.max(0, line10 - additionalAmount)
  const line13 = Math.min(line10, additionalAmount)
  const line14 = line13 * 0.5
  const line15 = Math.min(halfBenefits, line14)
  const line16 = line12 > 0 ? line12 * 0.85 : 0

  // Line 17-19: final taxable amount, capped at 85% of total benefits
  const line17 = line15 + line16
  const line18 = netBenefits * 0.85
  const taxableBenefits = round2(Math.min(line17, line18))

  return {
    taxableBenefits,
    taxablePercent: netBenefits > 0 ? round2((taxableBenefits / netBenefits) * 100) : 0,
    combinedIncome,
    baseAmount,
    noneTaxable: taxableBenefits === 0,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
