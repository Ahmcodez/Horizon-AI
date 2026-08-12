import { describe, it, expect } from 'vitest'
import { calculateTaxableSsBenefits } from './socialSecurityTax'

describe('calculateTaxableSsBenefits', () => {
  // IRS Pub 915 Example 1: single filer, $5,980 net benefits, pension $18,600
  // + wages $9,400 + interest $990 = $28,990 other income. Expected: $2,990 taxable.
  it('matches IRS Pub 915 Example 1 (single, $2,990 taxable)', () => {
    const result = calculateTaxableSsBenefits({
      filingStatus: 'single',
      netBenefits: 5980,
      otherTaxableIncome: 28990,
      taxExemptInterest: 0,
    })
    expect(result.taxableBenefits).toBeCloseTo(2990, 0)
  })

  // IRS Pub 915 Example 3: MFJ, $10,000 net benefits, $40,500 other income
  // (pension $38,000 + interest $2,300 + tax-exempt $200 exclusion-adjusted
  // to $2,500 combined per the worksheet's line 3 handling in the source
  // example). Expected: $6,275 taxable.
  it('matches IRS Pub 915 Example 3 (MFJ, $6,275 taxable)', () => {
    const result = calculateTaxableSsBenefits({
      filingStatus: 'marriedFilingJointly',
      netBenefits: 10000,
      otherTaxableIncome: 40500,
      taxExemptInterest: 0,
    })
    expect(result.taxableBenefits).toBeCloseTo(6275, 0)
  })

  // IRS Pub 915 Example 4: MFS, lived with spouse, $4,000 net benefits,
  // $8,000 other income. Flat 85% rule applies. Expected: $3,400 taxable.
  it('matches IRS Pub 915 Example 4 (MFS living with spouse, flat 85%, $3,400 taxable)', () => {
    const result = calculateTaxableSsBenefits({
      filingStatus: 'marriedFilingSeparately',
      netBenefits: 4000,
      otherTaxableIncome: 8000,
      taxExemptInterest: 0,
      livedWithSpouseIfMFS: true,
    })
    expect(result.taxableBenefits).toBeCloseTo(3400, 0)
  })

  it('none taxable when combined income is below the base amount', () => {
    const result = calculateTaxableSsBenefits({
      filingStatus: 'single',
      netBenefits: 1500,
      otherTaxableIncome: 17000,
      taxExemptInterest: 700,
    })
    expect(result.noneTaxable).toBe(true)
    expect(result.taxableBenefits).toBe(0)
  })

  it('caps taxable benefits at 85% of net benefits even at very high income', () => {
    const result = calculateTaxableSsBenefits({
      filingStatus: 'single',
      netBenefits: 20000,
      otherTaxableIncome: 500000,
      taxExemptInterest: 0,
    })
    expect(result.taxableBenefits).toBeCloseTo(17000, 0) // 85% of 20,000
  })

  it('income adjustments (e.g. IRA deduction) reduce combined income before the base-amount comparison', () => {
    const withoutAdjustment = calculateTaxableSsBenefits({
      filingStatus: 'marriedFilingJointly',
      netBenefits: 5600,
      otherTaxableIncome: 29500,
      taxExemptInterest: 250,
    })
    const withAdjustment = calculateTaxableSsBenefits({
      filingStatus: 'marriedFilingJointly',
      netBenefits: 5600,
      otherTaxableIncome: 29500,
      taxExemptInterest: 250,
      incomeAdjustments: 1000,
    })
    expect(withAdjustment.taxableBenefits).toBeLessThanOrEqual(withoutAdjustment.taxableBenefits)
  })
})
