import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  generateClaimingComparison,
  getFullRetirementAge,
  calculateBreakevenAge,
} from '../lib/socialSecurity'
import { getProfile, saveProfile, DEFAULT_PROFILE } from '../lib/profileStore'
import { useAuth } from '../lib/authContext'
import { useAssistant } from '../lib/assistantContext'
import BenefitChart from '../components/BenefitChart'
import HouseholdPanel from '../components/HouseholdPanel'
import UpgradeGate from '../components/UpgradeGate'

export default function CalculatorPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { setGroundingContext, setDraftQuestion, open } = useAssistant()

  const [birthYear, setBirthYearState] = useState(DEFAULT_PROFILE.birthYear)
  const [pia, setPiaState] = useState(DEFAULT_PROFILE.pia)
  const [selectedAge, setSelectedAge] = useState(67)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProfile(user.uid)
      .then((profile) => {
        setBirthYearState(profile.birthYear)
        setPiaState(profile.pia)
        setProfileLoaded(true)
      })
      .catch((err) => {
        console.error('Failed to load profile from Firestore:', err)
        setLoadError(
          err?.code === 'permission-denied'
            ? "Firestore denied this read — your security rules likely haven't been deployed/published yet. See docs/SECURITY.md and firestore.rules in the repo."
            : 'Could not load your saved numbers. Check your Firebase config in .env.local and that Firestore is enabled for this project.'
        )
      })
  }, [user])

  function setBirthYear(value: number) {
    setBirthYearState(value)
    if (user) saveProfile(user.uid, { birthYear: value })
  }
  function setPia(value: number) {
    setPiaState(value)
    if (user) saveProfile(user.uid, { pia: value })
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

  useEffect(() => {
    if (!profileLoaded) return
    setGroundingContext({
      birthYear,
      pia,
      fullRetirementAge: fra.months > 0 ? `${fra.years} years, ${fra.months} months` : `${fra.years}`,
      comparison: comparison.map((c) => ({ age: c.age, monthlyBenefit: c.monthlyBenefit })),
      breakevenAge: breakeven,
    })
  }, [profileLoaded, birthYear, pia, fra, comparison, breakeven, setGroundingContext])

  function explain(question: string) {
    setDraftQuestion(question)
    open()
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8 bg-paper-dim">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-wide text-red-500 mb-3">Couldn't load your data</div>
          <p className="text-sm text-ink leading-relaxed">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-dim">
        <div className="font-mono text-sm text-muted">Loading your numbers…</div>
      </div>
    )
  }

  return (
    <main
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="max-w-[1280px] mx-auto px-8 pt-32 pb-24 bg-paper-dim min-h-screen"
    >
      {/* Intro */}
      <div className="mb-10 max-w-2xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/50 font-semibold">
            <span className="w-4 h-[1.5px] bg-gold" />
            Your claiming-age calculator
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/onboarding')}
              className="text-xs font-mono text-muted hover:text-ink transition-colors whitespace-nowrap"
            >
              Redo the 5-minute setup →
            </button>
            <span className="text-ink/15">|</span>
            <button
              onClick={() => signOut()}
              className="text-xs font-mono text-muted hover:text-red-500 transition-colors whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-ink">
          See what your benefit is worth, at every age from 62 to 70.
        </h1>
        <p className="mt-4 text-muted text-lg leading-relaxed">
          Enter the numbers from your SSA statement — your full retirement age benefit is called
          your "Primary Insurance Amount," or PIA.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8" id="calculator">
        {/* Input form */}
        <div className="bg-paper border border-ink/8 rounded-3xl p-8 shadow-card-light h-fit">
          <h2 className="text-xl font-semibold mb-6 text-ink">Your information</h2>

          <label className="block mb-6">
            <span className="text-sm font-medium text-ink block mb-2">Birth year</span>
            <input
              type="number"
              value={birthYear}
              min={1943}
              max={1970}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="w-full bg-paper-dim border border-ink/10 rounded-xl px-4 py-3 font-mono text-base focus:border-gold outline-none transition-colors text-ink"
            />
            <span className="text-xs text-muted mt-1.5 block">
              Your full retirement age is {fra.years}
              {fra.months > 0 ? ` and ${fra.months} months` : ''}.
            </span>
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-ink block mb-2">
              Benefit at full retirement age (PIA)
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono">$</span>
              <input
                type="number"
                value={pia}
                min={0}
                step={50}
                onChange={(e) => setPia(Number(e.target.value))}
                className="w-full bg-paper-dim border border-ink/10 rounded-xl pl-8 pr-4 py-3 font-mono text-base focus:border-gold outline-none transition-colors text-ink"
              />
            </div>
            <span className="text-xs text-muted mt-1.5 block">
              Found on your SSA statement at ssa.gov/myaccount.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink block mb-2">
              Compare claiming at age <span className="font-mono text-gold">{selectedAge}</span>
            </span>
            <input
              type="range"
              min={62}
              max={70}
              step={1}
              value={selectedAge}
              onChange={(e) => setSelectedAge(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="flex justify-between text-xs font-mono text-muted mt-1">
              <span>62</span>
              <span>70</span>
            </div>
          </label>
        </div>

        {/* Results */}
        <div id="results" className="space-y-6">
          {/* Key stat row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-paper border border-ink/8 shadow-card-light rounded-2xl p-5 relative group">
              <div className="font-mono text-2xl font-semibold text-ink">
                ${selected.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted mt-1">monthly at age {selectedAge}</div>
              <button
                onClick={() => explain(`Why is my benefit $${selected.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo at age ${selectedAge}?`)}
                className="absolute top-3 right-3 text-[10px] font-mono text-muted/60 hover:text-gold transition-colors"
              >
                explain
              </button>
            </div>
            <div className="bg-obsidian-elevated text-paper rounded-2xl p-5 shadow-card-dark relative group">
              <div className="font-mono text-2xl font-semibold text-gold">
                +${lifetimeDiff.toLocaleString()}
              </div>
              <div className="text-xs text-paper/50 mt-1">lifetime gain, 70 vs. 62 (to age 85)</div>
              <button
                onClick={() => explain(`Why does waiting until 70 instead of 62 add $${lifetimeDiff.toLocaleString()} over my lifetime?`)}
                className="absolute top-3 right-3 text-[10px] font-mono text-paper/40 hover:text-gold transition-colors"
              >
                explain
              </button>
            </div>
            <div className="bg-paper border border-ink/8 shadow-card-light rounded-2xl p-5 relative group">
              <div className="font-mono text-2xl font-semibold text-ink">
                {breakeven ? breakeven.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-muted mt-1">breakeven age, 62 vs. 70</div>
              <button
                onClick={() => explain(`What does my breakeven age of ${breakeven?.toFixed(1)} actually mean?`)}
                className="absolute top-3 right-3 text-[10px] font-mono text-muted/60 hover:text-gold transition-colors"
              >
                explain
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-paper border border-ink/8 rounded-3xl p-8 shadow-card-light">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-ink">Benefit by claiming age</h2>
              <div className="flex gap-4 text-xs font-mono text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-obsidian inline-block" /> FRA ({fra.years})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gold inline-block" /> Selected
                </span>
              </div>
            </div>
            <BenefitChart data={comparison} highlightAge={selectedAge} fraAge={fra.years} />
          </div>

          {/* Table */}
          <div className="bg-paper border border-ink/8 rounded-3xl p-8 shadow-card-light overflow-x-auto">
            <h2 className="text-xl font-semibold mb-5 text-ink">Full comparison</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-ink/8">
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
                    className={`border-b border-ink/5 cursor-pointer transition-colors text-ink ${
                      row.age === selectedAge ? 'bg-gold/10' : 'hover:bg-paper-dim'
                    }`}
                  >
                    <td className="py-3">
                      {row.age}
                      {row.age === fra.years && (
                        <span className="ml-2 text-[10px] bg-obsidian text-paper px-1.5 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-luxe)' }}>
                          FRA
                        </span>
                      )}
                    </td>
                    <td className="py-3">${row.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-3">${row.annualBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className={`py-3 ${row.vsFraPct > 0 ? 'text-emerald' : row.vsFraPct < 0 ? 'text-red-500' : ''}`}>
                      {row.vsFraPct > 0 ? '+' : ''}
                      {row.vsFraPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <UpgradeGate feature="Spousal & survivor coordination">
            <HouseholdPanel primaryPia={pia} primaryBirthYear={birthYear} />
          </UpgradeGate>

          <p className="text-xs text-muted leading-relaxed max-w-2xl">
            These figures are informational estimates based on the Primary Insurance Amount you
            entered and published SSA claiming-age adjustment rules. They do not account for
            future COLA increases beyond 2026 — not financial, legal, or tax advice.
          </p>
        </div>
      </div>
    </main>
  )
}
