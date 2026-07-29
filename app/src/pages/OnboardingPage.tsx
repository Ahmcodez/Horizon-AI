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
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="min-h-screen flex items-center justify-center px-6 bg-obsidian relative overflow-hidden"
    >
      <div
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,183,0,0.14), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)' }}
      />

      <div className="w-full max-w-lg relative">
        {step !== 'welcome' && step !== 'done' && (
          <div className="flex gap-1.5 mb-8">
            {STEPS.slice(1, -1).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= stepIndex - 1 ? 'bg-gold' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        <div className="bg-paper rounded-3xl p-10 shadow-glow-white overflow-hidden">
          <div
            key={step}
            style={{
              animation: `${direction === 1 ? 'stepEnterForward' : 'stepEnterBack'} 0.4s cubic-bezier(.16,.8,.24,1)`,
            }}
          >
            {step === 'welcome' && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gold font-semibold mb-6">
                  <span className="w-4 h-[1.5px] bg-gold" />5 minutes
                </div>
                <h1 className="text-3xl font-semibold leading-tight mb-4 text-ink">
                  Let's find your number.
                </h1>
                <p className="text-muted leading-relaxed mb-8">
                  A few quick questions — the same ones you'd answer once, so every screen after
                  this one already knows your situation.
                </p>
                <button
                  onClick={next}
                  className="w-full bg-obsidian text-paper font-semibold py-3.5 rounded-full shadow-card-dark hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.4)] transition-all"
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
                  className="w-full bg-paper-dim border border-ink/10 rounded-xl px-4 py-3.5 font-mono text-lg text-center focus:border-gold outline-none text-ink"
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono text-lg">$</span>
                  <input
                    type="number"
                    value={draft.pia}
                    min={0}
                    step={50}
                    onChange={(e) => setDraft({ ...draft, pia: Number(e.target.value) })}
                    className="w-full bg-paper-dim border border-ink/10 rounded-xl pl-9 pr-4 py-3.5 font-mono text-lg text-center focus:border-gold outline-none text-ink"
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
                      className={`w-full text-left px-5 py-3.5 rounded-xl border font-medium capitalize transition-all ${
                        draft.maritalStatus === option
                          ? 'bg-emerald text-obsidian border-emerald shadow-glow-emerald'
                          : 'bg-paper-dim border-ink/8 hover:border-emerald/40 text-ink'
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
                    className={`flex-1 py-3.5 rounded-xl border font-semibold transition-all ${
                      draft.hasNonCoveredPension
                        ? 'bg-obsidian text-paper border-obsidian'
                        : 'bg-paper-dim border-ink/8 text-ink'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDraft({ ...draft, hasNonCoveredPension: false })}
                    className={`flex-1 py-3.5 rounded-xl border font-semibold transition-all ${
                      !draft.hasNonCoveredPension
                        ? 'bg-obsidian text-paper border-obsidian'
                        : 'bg-paper-dim border-ink/8 text-ink'
                    }`}
                  >
                    No
                  </button>
                </div>
              </StepShell>
            )}

            {step === 'done' && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center mx-auto mb-6 shadow-glow-gold">
                  <span className="text-obsidian font-bold text-xl">✓</span>
                </div>
                <h1 className="text-3xl font-semibold leading-tight mb-4 text-ink">
                  You're all set.
                </h1>
                <p className="text-muted leading-relaxed mb-8">
                  Your numbers are saved on this device. See your full claiming-age breakdown now.
                </p>
                <button
                  onClick={finish}
                  className="w-full bg-obsidian text-paper font-semibold py-3.5 rounded-full shadow-card-dark hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.4)] transition-all"
                >
                  See my results
                </button>
              </div>
            )}
          </div>

          {step !== 'welcome' && step !== 'done' && (
            <div className="mt-8">
              {error && (
                <div className="text-xs text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4">{error}</div>
              )}
              <div className="flex justify-between">
                <button onClick={back} className="text-sm font-medium text-muted hover:text-ink transition-colors">
                  ← Back
                </button>
                <button
                  onClick={next}
                  disabled={saving}
                  className="bg-obsidian text-paper px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving…' : isLastContentStep ? 'Finish' : 'Continue'}
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== 'welcome' && step !== 'done' && (
          <p className="text-center text-xs text-paper/40 mt-5">
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
      <h2 className="text-2xl font-semibold leading-tight mb-2 text-ink">{title}</h2>
      <p className="text-sm text-muted mb-6 leading-relaxed">{sub}</p>
      {children}
    </div>
  )
}
