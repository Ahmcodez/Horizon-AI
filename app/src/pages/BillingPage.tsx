import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan, startCheckout, openBillingPortal } from '../lib/billing'
import { useReveal } from '../lib/useReveal'

export default function BillingPage() {
  const { user } = useAuth()
  const { plan, status } = usePlan(user?.uid)
  const [searchParams] = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<'plan' | 'advisor' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const reveal = useReveal<HTMLDivElement>()

  const checkoutResult = searchParams.get('checkout')

  useEffect(() => {
    document.title = 'Billing & Plans | MyClaimAge'
  }, [])

  useEffect(() => {
    if (checkoutResult) {
      const url = new URL(window.location.href)
      url.searchParams.delete('checkout')
      window.history.replaceState({}, '', url.toString())
    }
  }, [checkoutResult])

  async function handleUpgrade(target: 'plan' | 'advisor') {
    setError(null)
    setLoadingPlan(target)
    try {
      await startCheckout(target)
    } catch (err) {
      setError('Could not start checkout — please try again.')
      setLoadingPlan(null)
    }
  }

  async function handleManage() {
    setError(null)
    setLoadingPlan('portal')
    try {
      await openBillingPortal()
    } catch (err) {
      setError('Could not open billing management — please try again.')
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
    <main
      className="max-w-4xl mx-auto px-8 pt-32 pb-24"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-lp-slate mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-lp-slate" />
          Billing
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-lp-graphite">Your plan</h1>
        <p className="mt-4 text-lp-slate text-lg leading-relaxed">
          Currently on the <span className="font-normal text-lp-graphite capitalize">{plan}</span>{' '}
          plan{status ? ` (${status})` : ''}.
        </p>
      </div>

      {checkoutResult === 'success' && (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[15px] px-5 py-4 mb-8 text-sm text-lp-good">
          Payment received — your plan updates automatically within a few seconds.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="bg-lp-chalk border border-lp-line-strong rounded-[15px] px-5 py-4 mb-8 text-sm text-lp-slate">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="bg-[#FEF2F2] text-lp-bad border border-[#FECACA] rounded-[15px] px-5 py-4 mb-8 text-sm">{error}</div>
      )}

      {(plan === 'plan' || plan === 'advisor') && (
        <div className="mb-10">
          <button
            onClick={handleManage}
            disabled={loadingPlan === 'portal'}
            className="ov-outlined-btn-lp px-6 py-3"
          >
            {loadingPlan === 'portal' ? 'Opening…' : 'Manage billing / cancel'}
          </button>
        </div>
      )}

      <div ref={reveal} className="reveal grid md:grid-cols-3 gap-5">
        <div className="hover-glow-lp border border-lp-line-strong rounded-[15px] p-8 bg-lp-chalk">
          <div className="text-xs uppercase tracking-[0.02em] text-lp-slate font-normal mb-4">Free</div>
          <div className="text-3xl font-normal mb-1 text-lp-graphite">$0</div>
          <p className="text-sm text-lp-slate mb-6">A real first look at your options.</p>
          <ul className="text-sm space-y-2.5 text-lp-graphite">
            <li className="flex gap-2"><span className="text-lp-good font-normal">✓</span> Single claiming-age estimate</li>
            <li className="flex gap-2"><span className="text-lp-good font-normal">✓</span> FRA &amp; delayed credit calculation</li>
          </ul>
          {plan === 'free' && <div className="mt-6 text-xs font-mono text-lp-slate">Your current plan</div>}
        </div>

        <div className="hover-glow-lp rounded-[15px] p-8 bg-lp-graphite text-lp-chalk relative border-2 border-[var(--color-lp-cyan)] shadow-lg">
          <div className="absolute -top-3 right-7 bg-lp-graphite border border-[var(--color-lp-cyan)] text-[var(--color-lp-cyan)] text-[11px] font-normal uppercase px-3 py-1.5 rounded-[5px]">
            Most chosen
          </div>
          <div className="text-xs uppercase tracking-[0.02em] text-lp-chalk font-normal mb-4">Plan</div>
          <div className="text-3xl font-normal mb-1">
            $12<span className="text-sm font-normal text-lp-chalk/50">/mo</span>
          </div>
          <p className="text-sm text-lp-chalk/60 mb-6">The full picture, kept current every year.</p>
          <ul className="text-sm space-y-2.5">
            <li className="flex gap-2"><span className="text-[var(--color-lp-cyan)] font-normal">✓</span> Spousal &amp; survivor coordination</li>
            <li className="flex gap-2"><span className="text-[var(--color-lp-cyan)] font-normal">✓</span> WEP/GPO-aware calculations</li>
            <li className="flex gap-2"><span className="text-[var(--color-lp-cyan)] font-normal">✓</span> RMD, SS taxation &amp; Medicare IRMAA calculators</li>
            <li className="flex gap-2"><span className="text-[var(--color-lp-cyan)] font-normal">✓</span> AI assistant &amp; document reader</li>
          </ul>
          {plan === 'free' ? (
            <button
              onClick={() => handleUpgrade('plan')}
              disabled={loadingPlan === 'plan'}
              className="lp-gradient-btn mt-6 w-full py-3"
            >
              {loadingPlan === 'plan' ? 'Redirecting…' : 'Upgrade to Plan'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-lp-chalk">
              {plan === 'plan' ? 'Your current plan' : 'Included in your plan'}
            </div>
          )}
        </div>

        <div className="hover-glow-lp border border-lp-line-strong rounded-[15px] p-8 bg-lp-chalk">
          <div className="text-xs uppercase tracking-[0.02em] text-lp-slate font-normal mb-4">Advisor</div>
          <div className="text-3xl font-normal mb-1 text-lp-graphite">
            $149<span className="text-sm font-normal text-lp-slate">/mo</span>
          </div>
          <p className="text-sm text-lp-slate mb-6">For advisors managing a full client book.</p>
          <ul className="text-sm space-y-2.5 text-lp-graphite">
            <li className="flex gap-2"><span className="text-lp-good font-normal">✓</span> Everything in Plan</li>
            <li className="flex gap-2"><span className="text-lp-good font-normal">✓</span> Unlimited client profiles</li>
            <li className="flex gap-2"><span className="text-lp-good font-normal">✓</span> Embeddable calculator widget</li>
          </ul>
          {plan !== 'advisor' ? (
            <button
              onClick={() => handleUpgrade('advisor')}
              disabled={loadingPlan === 'advisor'}
              className="lp-gradient-btn mt-6 w-full py-3"
            >
              {loadingPlan === 'advisor' ? 'Redirecting…' : 'Upgrade to Advisor'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-lp-slate">Your current plan</div>
          )}
        </div>
      </div>
    </main>
    </div>
  )
}
