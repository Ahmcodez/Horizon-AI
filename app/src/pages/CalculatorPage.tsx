import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  generateClaimingComparison,
  getFullRetirementAge,
  calculateBreakevenAge,
} from '../lib/socialSecurity'
import { getProfile, saveProfile } from '../lib/profileStore'
import BenefitChart from '../components/BenefitChart'
import HouseholdPanel from '../components/HouseholdPanel'

export default function CalculatorPage() {
  const navigate = useNavigate()
  const profile = useMemo(() => getProfile(), [])

  const [birthYear, setBirthYearState] = useState(profile.birthYear)
  const [pia, setPiaState] = useState(profile.pia)
  const [selectedAge, setSelectedAge] = useState(67)

  function setBirthYear(value: number) {
    setBirthYearState(value)
    saveProfile({ birthYear: value })
  }
  function setPia(value: number) {
    setPiaState(value)
    saveProfile({ pia: value })
  }

  const fra = useMemo(() => getFullRetirementAge(birthYear), [birthYear])
  const comparison = useMemo(() => generateClaimingComparison(pia, birthYear), [pia, birthYear])

  const selected = comparison.find((c) => c.age === selectedAge)!
  const age62 = comparison.find((c) => c.age === 62)!
  const age70 = comparison.find((c) => c.age === 70)!

  const breakeven = useMemo(
    () => calculateBreakevenAge(pia, birthYear, 62, 70),
    [pia, birthYear]
  )

  const lifetimeDiff = useMemo(() => {
    // rough illustrative lifetime total to age 85 for 62-claim vs 70-claim
    const yearsAt62 = 85 - 62
    const yearsAt70 = 85 - 70
    const total62 = age62.annualBenefit * yearsAt62
    const total70 = age70.annualBenefit * yearsAt70
    return Math.round(total70 - total62)
  }, [age62, age70])

  return (
    <main className="max-w-[1280px] mx-auto px-8 pt-32 pb-24">
      {/* Intro */}
      <div className="mb-10 max-w-2xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold">
            <span className="w-4 h-[1.5px] bg-amber-deep" />
            Your claiming-age calculator
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-xs font-mono text-slate hover:text-amber-deep transition-colors whitespace-nowrap"
          >
            Redo the 5-minute setup →
          </button>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-normal tracking-tight leading-tight">
          See what your benefit is worth, at every age from 62 to 70.
        </h1>
        <p className="mt-4 text-slate text-lg leading-relaxed">
          Enter the numbers from your SSA statement — your full retirement age benefit is called
          your "Primary Insurance Amount," or PIA.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8" id="calculator">
        {/* Input form */}
        <div className="bg-chalk-dim border border-graphite/10 rounded-3xl p-8 shadow-sm h-fit">
          <h2 className="font-display text-xl font-medium mb-6">Your information</h2>

          <label className="block mb-6">
            <span className="text-sm font-medium text-graphite block mb-2">Birth year</span>
            <input
              type="number"
              value={birthYear}
              min={1943}
              max={1970}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="w-full bg-chalk border border-graphite/15 rounded-xl px-4 py-3 font-mono text-base focus:border-amber-deep outline-none transition-colors"
            />
            <span className="text-xs text-slate mt-1.5 block">
              Your full retirement age is {fra.years}
              {fra.months > 0 ? ` and ${fra.months} months` : ''}.
            </span>
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-graphite block mb-2">
              Benefit at full retirement age (PIA)
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate font-mono">$</span>
              <input
                type="number"
                value={pia}
                min={0}
                step={50}
                onChange={(e) => setPia(Number(e.target.value))}
                className="w-full bg-chalk border border-graphite/15 rounded-xl pl-8 pr-4 py-3 font-mono text-base focus:border-amber-deep outline-none transition-colors"
              />
            </div>
            <span className="text-xs text-slate mt-1.5 block">
              Found on your SSA statement at ssa.gov/myaccount.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-graphite block mb-2">
              Compare claiming at age <span className="font-mono text-amber-deep">{selectedAge}</span>
            </span>
            <input
              type="range"
              min={62}
              max={70}
              step={1}
              value={selectedAge}
              onChange={(e) => setSelectedAge(Number(e.target.value))}
              className="w-full accent-amber"
            />
            <div className="flex justify-between text-xs font-mono text-slate mt-1">
              <span>62</span>
              <span>70</span>
            </div>
          </label>
        </div>

        {/* Results */}
        <div id="results" className="space-y-6">
          {/* Key stat row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-chalk border border-graphite/10 rounded-2xl p-5 shadow-xs">
              <div className="font-mono text-2xl font-semibold">
                ${selected.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-slate mt-1">monthly at age {selectedAge}</div>
            </div>
            <div className="bg-graphite text-chalk rounded-2xl p-5 shadow-dark">
              <div className="font-mono text-2xl font-semibold text-amber">
                +${lifetimeDiff.toLocaleString()}
              </div>
              <div className="text-xs text-chalk/60 mt-1">lifetime gain, 70 vs. 62 (to age 85)</div>
            </div>
            <div className="bg-chalk border border-graphite/10 rounded-2xl p-5 shadow-xs">
              <div className="font-mono text-2xl font-semibold">
                {breakeven ? breakeven.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-slate mt-1">breakeven age, 62 vs. 70</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-chalk border border-graphite/10 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-xl font-medium">Benefit by claiming age</h2>
              <div className="flex gap-4 text-xs font-mono text-slate">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-graphite inline-block" /> FRA ({fra.years})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber inline-block" /> Selected
                </span>
              </div>
            </div>
            <BenefitChart data={comparison} highlightAge={selectedAge} fraAge={fra.years} />
          </div>

          {/* Table */}
          <div className="bg-chalk border border-graphite/10 rounded-3xl p-8 shadow-sm overflow-x-auto">
            <h2 className="font-display text-xl font-medium mb-5">Full comparison</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate border-b border-graphite/10">
                  <th className="pb-3 font-medium">Age</th>
                  <th className="pb-3 font-medium">Monthly</th>
                  <th className="pb-3 font-medium">Annual</th>
                  <th className="pb-3 font-medium">vs. FRA</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {comparison.map((row) => (
                  <tr
                    key={row.age}
                    onClick={() => setSelectedAge(row.age)}
                    className={`border-b border-graphite/5 cursor-pointer transition-colors ${
                      row.age === selectedAge ? 'bg-amber/10' : 'hover:bg-chalk-dim'
                    }`}
                  >
                    <td className="py-3">
                      {row.age}
                      {row.age === fra.years && (
                        <span className="ml-2 text-[10px] bg-graphite text-chalk px-1.5 py-0.5 rounded-full font-sans">
                          FRA
                        </span>
                      )}
                    </td>
                    <td className="py-3">${row.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-3">${row.annualBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className={`py-3 ${row.vsFraPct > 0 ? 'text-amber-deep' : row.vsFraPct < 0 ? 'text-warn' : ''}`}>
                      {row.vsFraPct > 0 ? '+' : ''}
                      {row.vsFraPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <HouseholdPanel primaryPia={pia} primaryBirthYear={birthYear} />

          <p className="text-xs text-slate leading-relaxed max-w-2xl">
            These figures are informational estimates based on the Primary Insurance Amount you
            entered and published SSA claiming-age adjustment rules. They do not account for
            future COLA increases beyond 2026 — not financial, legal, or tax advice.
          </p>
        </div>
      </div>
    </main>
  )
}
