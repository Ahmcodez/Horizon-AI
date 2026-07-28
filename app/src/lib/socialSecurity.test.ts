import { describe, it, expect } from 'vitest'
import {
  getFullRetirementAge,
  calculateMonthlyBenefit,
  generateClaimingComparison,
  calculateBreakevenAge,
  calculateSpousalBenefit,
  calculateSurvivorBenefit,
  getPensionOffsetStatus,
  applyCola,
  calculateEarningsWithholding,
  applyUniformCut,
  calculateLifetimeTotal,
  ageToMonths,
  round2,
} from './socialSecurity'

/**
 * These tests exist because we spent this whole build manually verifying
 * the engine against known SSA reference figures with disposable scripts,
 * deleted after each check. That's not repeatable - this file makes those
 * same checks permanent, so a future change can't silently break the math
 * that this entire product's trust depends on.
 */

describe('getFullRetirementAge', () => {
  it('returns 67 for anyone born 1960 or later', () => {
    expect(getFullRetirementAge(1960)).toEqual({ years: 67, months: 0, totalMonths: 804 })
    expect(getFullRetirementAge(1990)).toEqual({ years: 67, months: 0, totalMonths: 804 })
  })

  it('returns 66 flat for the 1943-1954 cohort', () => {
    expect(getFullRetirementAge(1950)).toEqual({ years: 66, months: 0, totalMonths: 792 })
  })

  it('phases in correctly for 1955-1959 birth years', () => {
    expect(getFullRetirementAge(1955)).toEqual({ years: 66, months: 2, totalMonths: 794 })
    expect(getFullRetirementAge(1957)).toEqual({ years: 66, months: 6, totalMonths: 798 })
    expect(getFullRetirementAge(1959)).toEqual({ years: 66, months: 10, totalMonths: 802 })
  })

  it('handles the pre-1943 cohort (FRA 65)', () => {
    expect(getFullRetirementAge(1937)).toEqual({ years: 65, months: 0, totalMonths: 780 })
    expect(getFullRetirementAge(1920)).toEqual({ years: 65, months: 0, totalMonths: 780 })
  })
})

describe('calculateMonthlyBenefit', () => {
  const fra67 = getFullRetirementAge(1965)

  it('applies exactly a 30% reduction at age 62 for FRA-67 filers', () => {
    expect(calculateMonthlyBenefit(2000, fra67, ageToMonths(62))).toBe(1400)
  })

  it('applies exactly a 24% increase at age 70 for FRA-67 filers', () => {
    expect(calculateMonthlyBenefit(2000, fra67, ageToMonths(70))).toBe(2480)
  })

  it('returns the unmodified PIA when claiming exactly at FRA', () => {
    expect(calculateMonthlyBenefit(2000, fra67, ageToMonths(67))).toBe(2000)
  })

  it('applies exactly a 25% reduction at age 62 for FRA-66 filers', () => {
    const fra66 = getFullRetirementAge(1950)
    expect(calculateMonthlyBenefit(2000, fra66, ageToMonths(62))).toBe(1500)
  })

  it('clamps claiming age to the 62-70 window', () => {
    // Below 62 and above 70 should behave identically to the boundary values.
    expect(calculateMonthlyBenefit(2000, fra67, ageToMonths(60))).toBe(
      calculateMonthlyBenefit(2000, fra67, ageToMonths(62))
    )
    expect(calculateMonthlyBenefit(2000, fra67, ageToMonths(75))).toBe(
      calculateMonthlyBenefit(2000, fra67, ageToMonths(70))
    )
  })
})

describe('generateClaimingComparison', () => {
  it('produces one row per whole age from 62 to 70', () => {
    const rows = generateClaimingComparison(2000, 1965)
    expect(rows).toHaveLength(9)
    expect(rows.map((r) => r.age)).toEqual([62, 63, 64, 65, 66, 67, 68, 69, 70])
  })

  it('marks the FRA row as 0% difference from itself', () => {
    const rows = generateClaimingComparison(2000, 1965)
    const fraRow = rows.find((r) => r.age === 67)!
    expect(fraRow.vsFraPct).toBe(0)
  })

  it('is monotonically increasing in monthly benefit as claiming age rises', () => {
    const rows = generateClaimingComparison(2000, 1965)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].monthlyBenefit).toBeGreaterThan(rows[i - 1].monthlyBenefit)
    }
  })
})

describe('calculateBreakevenAge', () => {
  it('returns a breakeven age between 62 and 70 that roughly matches commonly cited figures (~80)', () => {
    const breakeven = calculateBreakevenAge(2000, 1965, 62, 70)
    expect(breakeven).not.toBeNull()
    expect(breakeven).toBeGreaterThan(78)
    expect(breakeven).toBeLessThan(82)
  })
})

describe('calculateSpousalBenefit', () => {
  it('caps at 50% of the higher earner\'s PIA when claimed at or after FRA', () => {
    const fra67 = getFullRetirementAge(1965)
    expect(calculateSpousalBenefit(2000, fra67, ageToMonths(67))).toBe(1000)
  })

  it('applies a 35% reduction at age 62 for an FRA-67 spouse', () => {
    const fra67 = getFullRetirementAge(1965)
    // max spousal = $1000; 60 months early = 36*(25/36) + 24*(5/12) = 25 + 10 = 35% reduction
    expect(calculateSpousalBenefit(2000, fra67, ageToMonths(62))).toBe(650)
  })
})

describe('calculateSurvivorBenefit', () => {
  const fra67 = getFullRetirementAge(1965)

  it('pays exactly 71.5% of the deceased\'s PIA at age 60', () => {
    const benefit = calculateSurvivorBenefit({
      deceasedPia: 2000,
      deceasedClaimedEarly: false,
      survivorFra: fra67,
      survivorClaimAgeMonths: ageToMonths(60),
    })
    expect(benefit).toBe(1430)
  })

  it('pays the full deceased PIA at the survivor\'s own FRA', () => {
    const benefit = calculateSurvivorBenefit({
      deceasedPia: 2000,
      deceasedClaimedEarly: false,
      survivorFra: fra67,
      survivorClaimAgeMonths: ageToMonths(67),
    })
    expect(benefit).toBe(2000)
  })
})

describe('getPensionOffsetStatus', () => {
  it('reports no reduction for pension holders, reflecting the Fairness Act repeal', () => {
    const status = getPensionOffsetStatus(true)
    expect(status.affected).toBe(false)
    expect(status.message).toContain('repealed')
  })

  it('reports not applicable when there is no non-covered pension', () => {
    const status = getPensionOffsetStatus(false)
    expect(status.affected).toBe(false)
    expect(status.message).toContain('Not applicable')
  })
})

describe('applyCola', () => {
  it('applies the 2026 COLA rate (2.8%) by default', () => {
    expect(applyCola(1000)).toBe(1028)
  })

  it('accepts a custom COLA rate', () => {
    expect(applyCola(1000, 0.05)).toBe(1050)
  })
})

describe('calculateEarningsWithholding', () => {
  it('withholds $1 per $2 over the limit when under FRA', () => {
    // $30,000 earnings, $24,480 limit -> (30000-24480)/2 = $2,760
    expect(calculateEarningsWithholding(30000, false)).toBe(2760)
  })

  it('withholds $1 per $3 over the more generous limit in the year FRA is reached', () => {
    // $70,000 earnings, $65,160 limit -> (70000-65160)/3 = $1,613.33
    expect(calculateEarningsWithholding(70000, true)).toBe(1613.33)
  })

  it('withholds nothing when earnings are under the limit', () => {
    expect(calculateEarningsWithholding(20000, false)).toBe(0)
  })
})

describe('applyUniformCut', () => {
  it('applies a 22% cut correctly across a comparison table', () => {
    const baseline = generateClaimingComparison(2000, 1965)
    const cut = applyUniformCut(baseline, 22)
    const fraRowBaseline = baseline.find((r) => r.age === 67)!
    const fraRowCut = cut.find((r) => r.age === 67)!
    expect(fraRowCut.monthlyBenefit).toBe(round2(fraRowBaseline.monthlyBenefit * 0.78))
    expect(fraRowCut.monthlyBenefit).toBe(1560)
  })

  it('a 0% cut leaves values unchanged', () => {
    const baseline = generateClaimingComparison(2000, 1965)
    const cut = applyUniformCut(baseline, 0)
    expect(cut).toEqual(baseline)
  })
})

describe('calculateLifetimeTotal', () => {
  it('computes lifetime total correctly for a simple case', () => {
    // $24,000/yr from age 62 to 85 = 23 years = $552,000
    expect(calculateLifetimeTotal(24000, 62, 85)).toBe(552000)
  })

  it('returns 0 if life expectancy is at or before the claiming age', () => {
    expect(calculateLifetimeTotal(24000, 70, 65)).toBe(0)
    expect(calculateLifetimeTotal(24000, 70, 70)).toBe(0)
  })
})
