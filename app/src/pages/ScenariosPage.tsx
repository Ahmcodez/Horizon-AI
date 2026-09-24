import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { getProfile, DEFAULT_PROFILE } from '../lib/profileStore'
import {
  generateClaimingComparison,
  applyUniformCut,
  calculateLifetimeTotal,
} from '../lib/socialSecurity'
import BenefitChart from '../components/BenefitChart'
import UpgradeGate from '../components/UpgradeGate'
import { useReveal } from '../lib/useReveal'

export default function ScenariosPage() {
  useEffect(() => {
    document.title = 'Scenario Modeling — Benefit Cuts & Longevity What-Ifs | MyClaimAge'
  }, [])

  const { user } = useAuth()
  const reveal = useReveal<HTMLDivElement>()
  const [birthYear, setBirthYear] = useState(DEFAULT_PROFILE.birthYear)
  const [pia, setPia] = useState(DEFAULT_PROFILE.pia)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProfile(user.uid)
      .then((p) => {
        setBirthYear(p.birthYear)
        setPia(p.pia)
        setLoaded(true)
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

  const baseline = useMemo(() => generateClaimingComparison(pia, birthYear), [pia, birthYear])

  return (
    <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
    <main
      className="max-w-5xl mx-auto px-8 pt-32 pb-24"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-lp-slate mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-lp-slate" />
          Scenario modeling
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-lp-graphite">
          What if things don't go exactly as planned?
        </h1>
        <p className="mt-4 text-lp-slate text-lg leading-relaxed">
          Two honest what-ifs — a possible future benefit cut, and a longer or shorter life than
          you assumed. Both use your real numbers, not guesses.
        </p>
      </div>

      {loadError ? (
        <div className="font-mono text-sm text-lp-bad bg-[#FEF2F2] border border-[#FECACA] rounded-[5px] px-5 py-4 max-w-2xl">
          {loadError}
        </div>
      ) : !loaded ? (
        <div className="font-mono text-sm text-lp-slate">Loading your numbers…</div>
      ) : (
        <UpgradeGate feature="Scenario modeling">
          <div ref={reveal} className="reveal space-y-8">
            <BenefitCutScenario baseline={baseline} />
            <LongevityScenario baseline={baseline} />
          </div>
        </UpgradeGate>
      )}
    </main>
    </div>
  )
}

function BenefitCutScenario({ baseline }: { baseline: ReturnType<typeof generateClaimingComparison> }) {
  const [cutPercent, setCutPercent] = useState(22)
  const cutScenarios = useMemo(() => applyUniformCut(baseline, cutPercent), [baseline, cutPercent])
  const fraRow = baseline[5] // age 67 is index 5 in the 62-70 array — used only for the chart's FRA marker

  return (
    <div className="hover-glow-lp bg-lp-chalk border border-lp-line-strong rounded-[15px] p-8">
      <h2 className="text-xl font-normal mb-1 text-lp-graphite">If benefits get cut</h2>
      <p className="text-sm text-lp-slate mb-6 max-w-2xl">
        Social Security's trust fund is projected to run short around 2032-2033. If Congress
        doesn't act by then, SSA could only pay a percentage of scheduled benefits — commonly
        cited estimates run in the 20-25% range. This isn't a prediction, just a way to see your
        numbers under that possibility.
      </p>

      <div className="mb-6">
        <span className="text-sm font-normal text-lp-slate block mb-2">
          Assume a <span className="font-mono text-lp-graphite">{cutPercent}%</span> across-the-board cut
        </span>
        <input
          type="range"
          min={0}
          max={30}
          value={cutPercent}
          onChange={(e) => setCutPercent(Number(e.target.value))}
          className="w-full accent-[var(--color-lp-cyan)]"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-wide text-lp-slate mb-3">As scheduled today</div>
          <BenefitChart data={baseline} highlightAge={67} fraAge={fraRow.age} />
        </div>
        <div>
          <div className="text-xs font-mono uppercase tracking-wide text-lp-graphite mb-3">
            After a {cutPercent}% cut
          </div>
          <BenefitChart data={cutScenarios} highlightAge={67} fraAge={fraRow.age} />
        </div>
      </div>
    </div>
  )
}

function LongevityScenario({ baseline }: { baseline: ReturnType<typeof generateClaimingComparison> }) {
  const [lifeExpectancy, setLifeExpectancy] = useState(85)

  const age62 = baseline.find((r) => r.age === 62)!
  const age67 = baseline.find((r) => r.age === 67)!
  const age70 = baseline.find((r) => r.age === 70)!

  const rows = [
    { label: 'Claim at 62', age: 62, annual: age62.annualBenefit },
    { label: 'Claim at 67 (FRA)', age: 67, annual: age67.annualBenefit },
    { label: 'Claim at 70', age: 70, annual: age70.annualBenefit },
  ]

  return (
    <div className="hover-glow-lp bg-lp-chalk border border-lp-line-strong rounded-[15px] p-8">
      <h2 className="text-xl font-normal mb-1 text-lp-graphite">If you live longer (or less long) than expected</h2>
      <p className="text-sm text-lp-slate mb-6 max-w-2xl">
        Claiming age math changes depending on how long you actually collect. Move the slider to
        see how the lifetime total shifts for each strategy under your own assumption.
      </p>

      <div className="mb-6 max-w-sm">
        <span className="text-sm font-normal text-lp-slate block mb-2">
          Assume you collect benefits until age{' '}
          <span className="font-mono text-lp-graphite">{lifeExpectancy}</span>
        </span>
        <input
          type="range"
          min={70}
          max={100}
          value={lifeExpectancy}
          onChange={(e) => setLifeExpectancy(Number(e.target.value))}
          className="w-full accent-[var(--color-lp-cyan)]"
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-lp-slate border-b border-lp-line-strong">
            <th className="pb-3 font-normal">Strategy</th>
            <th className="pb-3 font-normal">Annual benefit</th>
            <th className="pb-3 font-normal">Lifetime total to age {lifeExpectancy}</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => {
            const total = calculateLifetimeTotal(row.annual, row.age, lifeExpectancy)
            const isBest = total === Math.max(...rows.map((r) => calculateLifetimeTotal(r.annual, r.age, lifeExpectancy)))
            return (
              <tr key={row.label} className={`border-b border-lp-line text-lp-graphite transition-colors ${isBest ? 'bg-[var(--color-lp-cyan)]/10' : ''}`}>
                <td className="py-3" style={{ fontFamily: 'var(--font-jakarta)' }}>{row.label}</td>
                <td className="py-3">${row.annual.toLocaleString()}</td>
                <td className="py-3 font-semibold">
                  ${total.toLocaleString()}
                  {isBest && (
                    <span
                      className="ml-2 text-[10px] border border-[var(--color-lp-cyan)] text-[var(--color-lp-cyan)] px-1.5 py-0.5 rounded-[3px] font-normal uppercase"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      best
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
