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
    document.title = 'Billing & Plans | Horizon'
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
    <main
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-4xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-fog-blue" />
          Billing
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white">Your plan</h1>
        <p className="mt-4 text-fog-blue text-lg leading-relaxed">
          Currently on the <span className="font-normal text-bone-white capitalize">{plan}</span>{' '}
          plan{status ? ` (${status})` : ''}.
        </p>
      </div>

      {checkoutResult === 'success' && (
        <div className="bg-graphite-veil/20 border border-bone-white/40 rounded-[15px] px-5 py-4 mb-8 text-sm text-bone-white">
          Payment received — your plan updates automatically within a few seconds.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="bg-graphite-veil/20 border border-ash-border rounded-[15px] px-5 py-4 mb-8 text-sm text-fog-blue">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="bg-vivid-obsidian text-bone-white border border-bone-white/40 rounded-[15px] px-5 py-4 mb-8 text-sm">{error}</div>
      )}

      {(plan === 'plan' || plan === 'advisor') && (
        <div className="mb-10">
          <button
            onClick={handleManage}
            disabled={loadingPlan === 'portal'}
            className="ov-outlined-btn px-6 py-3"
          >
            {loadingPlan === 'portal' ? 'Opening…' : 'Manage billing / cancel'}
          </button>
        </div>
      )}

      <div ref={reveal} className="reveal grid md:grid-cols-3 gap-5">
        <div className="hover-glow-white border border-ash-border rounded-[15px] p-8 bg-graphite-veil/20">
          <div className="text-xs uppercase tracking-[0.02em] text-fog-blue font-normal mb-4">Free</div>
          <div className="text-3xl font-normal mb-1 text-bone-white">$0</div>
          <p className="text-sm text-fog-blue mb-6">A real first look at your options.</p>
          <ul className="text-sm space-y-2.5 text-bone-white">
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> Single claiming-age estimate</li>
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> FRA &amp; delayed credit calculation</li>
          </ul>
          {plan === 'free' && <div className="mt-6 text-xs font-mono text-fog-blue">Your current plan</div>}
        </div>

        <div className="hover-glow-white rounded-[15px] p-8 bg-graphite-veil/40 text-bone-white relative border-2 border-bone-white">
          <div className="absolute -top-3 right-7 bg-vivid-obsidian border border-bone-white text-bone-white text-[11px] font-normal uppercase px-3 py-1.5 rounded-[5px]">
            Most chosen
          </div>
          <div className="text-xs uppercase tracking-[0.02em] text-bone-white font-normal mb-4">Plan</div>
          <div className="text-3xl font-normal mb-1">
            $12<span className="text-sm font-normal text-bone-white/50">/mo</span>
          </div>
          <p className="text-sm text-bone-white/60 mb-6">The full picture, kept current every year.</p>
          <ul className="text-sm space-y-2.5">
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> Spousal &amp; survivor coordination</li>
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> WEP/GPO-aware calculations</li>
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> AI assistant &amp; document reader</li>
          </ul>
          {plan === 'free' ? (
            <button
              onClick={() => handleUpgrade('plan')}
              disabled={loadingPlan === 'plan'}
              className="ov-outlined-btn mt-6 w-full py-3"
            >
              {loadingPlan === 'plan' ? 'Redirecting…' : 'Upgrade to Plan'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-bone-white">
              {plan === 'plan' ? 'Your current plan' : 'Included in your plan'}
            </div>
          )}
        </div>

        <div className="hover-glow-white border border-ash-border rounded-[15px] p-8 bg-graphite-veil/20">
          <div className="text-xs uppercase tracking-[0.02em] text-fog-blue font-normal mb-4">Advisor</div>
          <div className="text-3xl font-normal mb-1 text-bone-white">
            $149<span className="text-sm font-normal text-fog-blue">/mo</span>
          </div>
          <p className="text-sm text-fog-blue mb-6">For advisors managing a full client book.</p>
          <ul className="text-sm space-y-2.5 text-bone-white">
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> Everything in Plan</li>
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> Unlimited client profiles</li>
            <li className="flex gap-2"><span className="text-bone-white font-normal">✓</span> Embeddable calculator widget</li>
          </ul>
          {plan !== 'advisor' ? (
            <button
              onClick={() => handleUpgrade('advisor')}
              disabled={loadingPlan === 'advisor'}
              className="ov-outlined-btn mt-6 w-full py-3"
            >
              {loadingPlan === 'advisor' ? 'Redirecting…' : 'Upgrade to Advisor'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-fog-blue">Your current plan</div>
          )}
        </div>
      </div>
    </main>
  )
}
