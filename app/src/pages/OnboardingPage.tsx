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
  const [direction, setDirection] = useState<1 | -1>(1)
  const [draft, setDraft] = useState<HorizonProfile>(DEFAULT_PROFILE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProfile(user.uid)
      .then(setDraft)
      .catch((err) => {
        console.warn('Could not load existing profile (may be a new user):', err)
      })
  }, [user])

  const step: Step = STEPS[stepIndex]
  const isLastContentStep = stepIndex === STEPS.length - 2

  async function next() {
    if (isLastContentStep && user) {
      setSaving(true)
      setError(null)
      try {
        await saveProfile(user.uid, { ...draft, onboardingCompletedAt: new Date().toISOString() })
      } catch (err) {
        console.error('Failed to save profile to Firestore:', err)
        setError(
          'Could not save your information — check that Firestore rules are deployed and your Firebase config is correct.'
        )
        setSaving(false)
        return
      }
      setSaving(false)
    }
    setDirection(1)
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function back() {
    setDirection(-1)
    setStepIndex((i) => Math.max(i - 1, 0))
  }
  function finish() {
    navigate('/calculator')
  }

  return (
    <main
      style={{ fontFamily: 'var(--font-jakarta)' }}
      className="min-h-screen flex items-center justify-center px-6 bg-lp-chalk-dim relative overflow-hidden"
    >
      <div className="w-full max-w-lg relative">
        {step !== 'welcome' && step !== 'done' && (
          <div className="flex gap-1.5 mb-8">
            {STEPS.slice(1, -1).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-[5px] transition-all duration-500 ${
                  i <= stepIndex - 1 ? 'bg-[var(--color-lp-cyan)]' : 'bg-lp-line-strong'
                }`}
              />
            ))}
          </div>
        )}

        <div className="bg-lp-chalk border border-lp-line-strong rounded-[15px] p-10 overflow-hidden">
          <div
            key={step}
            style={{
              animation: `${direction === 1 ? 'stepEnterForward' : 'stepEnterBack'} 0.4s cubic-bezier(.16,.8,.24,1)`,
            }}
          >
            {step === 'welcome' && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.02em] text-lp-slate mb-6">
                  <span className="w-4 h-[1.5px] bg-lp-slate" />5 minutes
                </div>
                <h1 className="text-heading-sm font-normal leading-tight mb-4 text-lp-graphite">
                  Let's find your number.
                </h1>
                <p className="text-lp-slate leading-relaxed mb-8">
                  A few quick questions — the same ones you'd answer once, so every screen after
                  this one already knows your situation.
                </p>
                <button onClick={next} className="lp-gradient-btn w-full py-3.5">
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
                  className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3.5 text-lg text-center focus:border-[var(--color-lp-cyan)] outline-none transition-colors text-lp-graphite"
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lp-slate text-lg">$</span>
                  <input
                    type="number"
                    value={draft.pia}
                    min={0}
                    step={50}
                    onChange={(e) => setDraft({ ...draft, pia: Number(e.target.value) })}
                    className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] pl-9 pr-4 py-3.5 text-lg text-center focus:border-[var(--color-lp-cyan)] outline-none transition-colors text-lp-graphite"
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
                      className={`w-full text-left px-5 py-3.5 rounded-[5px] border capitalize transition-colors duration-500 text-lp-graphite ${
                        draft.maritalStatus === option
                          ? 'bg-lp-chalk-dim border-[var(--color-lp-cyan)]'
                          : 'border-lp-line-strong hover:border-lp-line-strong'
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
                    className={`flex-1 py-3.5 rounded-[5px] border transition-colors duration-500 text-lp-graphite ${
                      draft.hasNonCoveredPension ? 'bg-lp-chalk-dim border-[var(--color-lp-cyan)]' : 'border-lp-line-strong'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDraft({ ...draft, hasNonCoveredPension: false })}
                    className={`flex-1 py-3.5 rounded-[5px] border transition-colors duration-500 text-lp-graphite ${
                      !draft.hasNonCoveredPension ? 'bg-lp-chalk-dim border-[var(--color-lp-cyan)]' : 'border-lp-line-strong'
                    }`}
                  >
                    No
                  </button>
                </div>
              </StepShell>
            )}

            {step === 'done' && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full border border-lp-graphite flex items-center justify-center mx-auto mb-6">
                  <span className="text-lp-graphite text-xl">✓</span>
                </div>
                <h1 className="text-heading-sm font-normal leading-tight mb-4 text-lp-graphite">
                  You're all set.
                </h1>
                <p className="text-lp-slate leading-relaxed mb-8">
                  Your numbers are saved on this device. See your full claiming-age breakdown now.
                </p>
                <button onClick={finish} className="lp-gradient-btn w-full py-3.5">
                  See my results
                </button>
              </div>
            )}
          </div>

          {step !== 'welcome' && step !== 'done' && (
            <div className="mt-8">
              {error && (
                <div className="text-xs text-lp-bad bg-[#FEF2F2] border border-[#FECACA] rounded-[5px] px-4 py-3 mb-4">
                  {error}
                </div>
              )}
              <div className="flex justify-between items-center">
                <button
                  onClick={back}
                  className="text-sm text-lp-slate hover:text-lp-graphite transition-colors duration-500"
                >
                  ← Back
                </button>
                <button onClick={next} disabled={saving} className="lp-gradient-btn">
                  {saving ? 'Saving…' : isLastContentStep ? 'Finish' : 'Continue'}
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== 'welcome' && step !== 'done' && (
          <p className="text-center text-xs text-lp-slate mt-5">
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
      <h2 className="text-heading-sm font-normal leading-tight mb-2 text-lp-graphite">{title}</h2>
      <p className="text-sm text-lp-slate mb-6 leading-relaxed">{sub}</p>
      {children}
    </div>
  )
}
