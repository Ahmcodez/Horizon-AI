import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProfile, getProfile, DEFAULT_PROFILE, type HorizonProfile } from '../lib/profileStore'
import { useAuth } from '../lib/authContext'

const STEPS = ['welcome', 'birthYear', 'pia', 'marital', 'pension', 'done'] as const
type Step = (typeof STEPS)[number]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<HorizonProfile>(DEFAULT_PROFILE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getProfile(user.uid).then(setDraft)
  }, [user])

  const step: Step = STEPS[stepIndex]
  const isLastContentStep = stepIndex === STEPS.length - 2

  async function next() {
    if (isLastContentStep && user) {
      setSaving(true)
      await saveProfile(user.uid, { ...draft, onboardingCompletedAt: new Date().toISOString() })
      setSaving(false)
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }
  function finish() {
    navigate('/calculator')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {step !== 'welcome' && step !== 'done' && (
          <div className="flex gap-1.5 mb-8">
            {STEPS.slice(1, -1).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex - 1 ? 'bg-amber' : 'bg-graphite/10'
                }`}
              />
            ))}
          </div>
        )}

        <div className="bg-chalk border border-graphite/10 rounded-3xl p-10 shadow-md">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-6">
                <span className="w-4 h-[1.5px] bg-amber-deep" />5 minutes
              </div>
              <h1 className="font-display text-3xl font-normal leading-tight mb-4">
                Let's find your number.
              </h1>
              <p className="text-slate leading-relaxed mb-8">
                A few quick questions — the same ones you'd answer once, so every screen after
                this one already knows your situation.
              </p>
              <button
                onClick={next}
                className="w-full bg-amber text-graphite font-semibold py-3.5 rounded-full shadow-sm hover:shadow-amber hover:-translate-y-0.5 transition-all"
              >
                Get started
              </button>
            </div>
          )}

          {step === 'birthYear' && (
            <StepShell title="When were you born?" sub="This determines your full retirement age.">
              <input
                type="number"
                value={draft.birthYear}
                min={1943}
                max={1970}
                onChange={(e) => setDraft({ ...draft, birthYear: Number(e.target.value) })}
                className="w-full bg-chalk-dim border border-graphite/15 rounded-xl px-4 py-3.5 font-mono text-lg text-center focus:border-amber-deep outline-none"
                autoFocus
              />
            </StepShell>
          )}

          {step === 'pia' && (
            <StepShell
              title="What's your benefit at full retirement age?"
              sub="This is your Primary Insurance Amount (PIA) — find it at ssa.gov/myaccount, on your Social Security statement."
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate font-mono text-lg">$</span>
                <input
                  type="number"
                  value={draft.pia}
                  min={0}
                  step={50}
                  onChange={(e) => setDraft({ ...draft, pia: Number(e.target.value) })}
                  className="w-full bg-chalk-dim border border-graphite/15 rounded-xl pl-9 pr-4 py-3.5 font-mono text-lg text-center focus:border-amber-deep outline-none"
                  autoFocus
                />
              </div>
            </StepShell>
          )}

          {step === 'marital' && (
            <StepShell title="What's your marital status?" sub="This affects whether spousal or survivor benefits apply to you.">
              <div className="space-y-2">
                {(['single', 'married', 'widowed'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setDraft({ ...draft, maritalStatus: option })}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border font-medium capitalize transition-colors ${
                      draft.maritalStatus === option
                        ? 'bg-graphite text-chalk border-graphite'
                        : 'bg-chalk-dim border-graphite/10 hover:border-amber-deep'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {step === 'pension' && (
            <StepShell
              title="Do you have a pension from work not covered by Social Security?"
              sub="For example, many teacher, firefighter, or police pensions. This used to reduce benefits under WEP/GPO — those rules were repealed in 2025."
            >
              <div className="flex gap-3">
                <button
                  onClick={() => setDraft({ ...draft, hasNonCoveredPension: true })}
                  className={`flex-1 py-3.5 rounded-xl border font-semibold transition-colors ${
                    draft.hasNonCoveredPension ? 'bg-graphite text-chalk border-graphite' : 'bg-chalk-dim border-graphite/10'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setDraft({ ...draft, hasNonCoveredPension: false })}
                  className={`flex-1 py-3.5 rounded-xl border font-semibold transition-colors ${
                    !draft.hasNonCoveredPension ? 'bg-graphite text-chalk border-graphite' : 'bg-chalk-dim border-graphite/10'
                  }`}
                >
                  No
                </button>
              </div>
            </StepShell>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-amber flex items-center justify-center mx-auto mb-6 shadow-amber">
                <span className="text-graphite font-bold text-xl">✓</span>
              </div>
              <h1 className="font-display text-3xl font-normal leading-tight mb-4">
                You're all set.
              </h1>
              <p className="text-slate leading-relaxed mb-8">
                Your numbers are saved on this device. See your full claiming-age breakdown now.
              </p>
              <button
                onClick={finish}
                className="w-full bg-amber text-graphite font-semibold py-3.5 rounded-full shadow-sm hover:shadow-amber hover:-translate-y-0.5 transition-all"
              >
                See my results
              </button>
            </div>
          )}

          {step !== 'welcome' && step !== 'done' && (
            <div className="flex justify-between mt-8">
              <button onClick={back} className="text-sm font-medium text-slate hover:text-graphite transition-colors">
                ← Back
              </button>
              <button
                onClick={next}
                disabled={saving}
                className="bg-graphite text-chalk px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-amber hover:text-graphite transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : isLastContentStep ? 'Finish' : 'Continue'}
              </button>
            </div>
          )}
        </div>

        {step !== 'welcome' && step !== 'done' && (
          <p className="text-center text-xs text-slate mt-5">
            Saved securely to your account — available whenever you sign back in.
          </p>
        )}
      </div>
    </main>
  )
}

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-normal leading-tight mb-2">{title}</h2>
      <p className="text-sm text-slate mb-6 leading-relaxed">{sub}</p>
      {children}
    </div>
  )
}
