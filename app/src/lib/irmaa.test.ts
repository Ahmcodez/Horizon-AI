import { describe, it, expect } from 'vitest'
import { calculateIrmaa, STANDARD_PART_B_PREMIUM_2026 } from './irmaa'

describe('calculateIrmaa', () => {
  it('no surcharge below the first single threshold', () => {
    const result = calculateIrmaa(108999, 'single')
    expect(result.tierIndex).toBe(0)
    expect(result.monthlyPartBTotal).toBe(STANDARD_PART_B_PREMIUM_2026)
    expect(result.monthlyTotalSurcharge).toBe(0)
  })

  it('cliff behavior: $1 over the threshold triggers the full tier 1 surcharge (single)', () => {
    const result = calculateIrmaa(109001, 'single')
    expect(result.tierIndex).toBe(1)
    expect(result.monthlyPartBTotal).toBe(284.1)
    expect(result.monthlyPartBSurcharge).toBeCloseTo(81.2, 1)
    expect(result.monthlyPartDSurcharge).toBe(14.5)
  })

  it('top tier (single, $500,000+): $689.90 Part B, $91.00 Part D', () => {
    const result = calculateIrmaa(600000, 'single')
    expect(result.tierIndex).toBe(5)
    expect(result.monthlyPartBTotal).toBe(689.9)
    expect(result.monthlyPartDSurcharge).toBe(91.0)
  })

  it('MFJ example: $250,000 MAGI lands in tier 1 ($284.10 Part B, $14.50 Part D)', () => {
    const result = calculateIrmaa(250000, 'marriedFilingJointly')
    expect(result.tierIndex).toBe(1)
    expect(result.monthlyPartBTotal).toBe(284.1)
    expect(result.monthlyPartDSurcharge).toBe(14.5)
    // Combined per spouse: $284.10 + $14.50 = $298.60/mo, matching the
    // $1,148/year-per-spouse figure cited in source material
    expect(result.monthlyTotalSurcharge).toBeCloseTo(95.7, 1)
  })

  it('MFS living with spouse: collapses to two tiers, $109,001 already hits the higher one', () => {
    const result = calculateIrmaa(109001, 'marriedFilingSeparately')
    expect(result.monthlyPartBTotal).toBe(649.2)
    expect(result.monthlyPartDSurcharge).toBe(83.3)
  })

  it('MFS at $391,000+ hits the top tier', () => {
    const result = calculateIrmaa(391001, 'marriedFilingSeparately')
    expect(result.monthlyPartBTotal).toBe(689.9)
  })

  it('annualTotalSurcharge is 12x the monthly figure', () => {
    const result = calculateIrmaa(600000, 'single')
    expect(result.annualTotalSurcharge).toBeCloseTo(result.monthlyTotalSurcharge * 12, 1)
  })
})
