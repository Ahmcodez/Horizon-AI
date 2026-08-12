import { describe, it, expect } from 'vitest'
import { getRmdStartAge, getUniformLifetimeDivisor, calculateRmd, projectRmdSchedule } from './rmd'

describe('getRmdStartAge', () => {
  it('is 73 for birth years 1951-1959', () => {
    expect(getRmdStartAge(1955)).toBe(73)
    expect(getRmdStartAge(1959)).toBe(73)
  })
  it('is 75 for birth years 1960+', () => {
    expect(getRmdStartAge(1960)).toBe(75)
    expect(getRmdStartAge(1970)).toBe(75)
  })
})

describe('getUniformLifetimeDivisor', () => {
  it('returns null below age 72', () => {
    expect(getUniformLifetimeDivisor(71)).toBeNull()
  })
  it('matches the published table at known ages', () => {
    expect(getUniformLifetimeDivisor(73)).toBe(26.5)
    expect(getUniformLifetimeDivisor(75)).toBe(24.6)
    expect(getUniformLifetimeDivisor(80)).toBe(20.2)
  })
  it('uses 2.0 for age 120 and above', () => {
    expect(getUniformLifetimeDivisor(120)).toBe(2.0)
    expect(getUniformLifetimeDivisor(150)).toBe(2.0)
  })
})

describe('calculateRmd', () => {
  // Worked examples cross-checked against published RMD calculators using
  // the same IRS table: $500,000 at age 73/75/80.
  it('$500,000 at age 73 -> $18,868', () => {
    const result = calculateRmd(500000, 73)
    expect(result?.rmdAmount).toBeCloseTo(18867.92, 1)
  })
  it('$500,000 at age 75 -> $20,325', () => {
    const result = calculateRmd(500000, 75)
    expect(result?.rmdAmount).toBeCloseTo(20325.2, 1)
  })
  it('$500,000 at age 80 -> $24,752', () => {
    const result = calculateRmd(500000, 80)
    expect(result?.rmdAmount).toBeCloseTo(24752.48, 1)
  })
  it('$200,000 at age 74 (turning 74 in the distribution year) -> $7,843', () => {
    const result = calculateRmd(200000, 74)
    expect(result?.rmdAmount).toBeCloseTo(7843.14, 1)
  })
  it('returns null under age 72', () => {
    expect(calculateRmd(500000, 65)).toBeNull()
  })
})

describe('projectRmdSchedule', () => {
  it('produces one entry per age from 72 through endAge', () => {
    const schedule = projectRmdSchedule(500000, 72, 75, 0)
    expect(schedule.map((y) => y.age)).toEqual([72, 73, 74, 75])
  })
  it('each RMD amount matches a direct calculateRmd call for that starting balance', () => {
    const schedule = projectRmdSchedule(500000, 73, 73, 0)
    expect(schedule[0].rmdAmount).toBeCloseTo(18867.92, 1)
  })
})
