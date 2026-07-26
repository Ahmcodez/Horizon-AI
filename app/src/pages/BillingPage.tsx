import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan, startCheckout, openBillingPortal } from '../lib/billing'

export default function BillingPage() {
  const { user } = useAuth()
  const { plan, status } = usePlan(user?.uid)
  const [searchParams] = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<'plan' | 'advisor' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkoutResult = searchParams.get('checkout')

  useEffect(() => {
    if (checkoutResult) {
      // Clear the query param after showing the message once, so a refresh
      // doesn't keep re-showing a stale "success"/"cancelled" banner.
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
    <main className="max-w-4xl mx-auto px-8 pt-32 pb-24">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-amber-deep" />
          Billing
        </div>
        <h1 className="font-display text-4xl font-normal tracking-tight leading-tight">
          Your plan
        </h1>
        <p className="mt-4 text-slate text-lg leading-relaxed">
          Currently on the <span className="font-semibold text-graphite capitalize">{plan}</span>{' '}
          plan{status ? ` (${status})` : ''}.
        </p>
      </div>

      {checkoutResult === 'success' && (
        <div className="bg-amber/10 border border-amber-deep/20 rounded-2xl px-5 py-4 mb-8 text-sm">
          Payment received — your plan updates automatically within a few seconds.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="bg-chalk-dim rounded-2xl px-5 py-4 mb-8 text-sm text-slate">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="bg-warn/10 text-warn rounded-2xl px-5 py-4 mb-8 text-sm">{error}</div>
      )}

      {(plan === 'plan' || plan === 'advisor') && (
        <div className="mb-10">
          <button
            onClick={handleManage}
            disabled={loadingPlan === 'portal'}
            className="bg-graphite text-chalk font-semibold px-6 py-3 rounded-full hover:bg-amber hover:text-graphite transition-colors disabled:opacity-60"
          >
            {loadingPlan === 'portal' ? 'Opening…' : 'Manage billing / cancel'}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        <div className="border border-graphite/10 rounded-3xl p-8 bg-chalk shadow-sm">
          <div className="text-xs font-mono uppercase tracking-wide text-amber-deep font-semibold mb-4">Free</div>
          <div className="font-display text-3xl font-medium mb-1">$0</div>
          <p className="text-sm text-slate mb-6">A real first look at your options.</p>
          <ul className="text-sm space-y-2.5">
            <li className="flex gap-2"><span className="text-amber-deep font-bold">✓</span> Single claiming-age estimate</li>
            <li className="flex gap-2"><span className="text-amber-deep font-bold">✓</span> FRA &amp; delayed credit calculation</li>
          </ul>
          {plan === 'free' && (
            <div className="mt-6 text-xs font-mono text-slate">Your current plan</div>
          )}
        </div>

        <div className="border-2 border-amber rounded-3xl p-8 bg-graphite text-chalk shadow-dark relative">
          <div className="absolute -top-3 right-7 bg-amber text-graphite text-[11px] font-mono font-bold px-3 py-1.5 rounded-full">
            Most chosen
          </div>
          <div className="text-xs font-mono uppercase tracking-wide text-amber font-semibold mb-4">Plan</div>
          <div className="font-display text-3xl font-medium mb-1">
            $12<span className="text-sm font-sans text-chalk/50">/mo</span>
          </div>
          <p className="text-sm text-chalk/60 mb-6">The full picture, kept current every year.</p>
          <ul className="text-sm space-y-2.5">
            <li className="flex gap-2"><span className="text-amber font-bold">✓</span> Spousal &amp; survivor coordination</li>
            <li className="flex gap-2"><span className="text-amber font-bold">✓</span> WEP/GPO-aware calculations</li>
            <li className="flex gap-2"><span className="text-amber font-bold">✓</span> AI assistant &amp; document reader</li>
          </ul>
          {plan === 'free' ? (
            <button
              onClick={() => handleUpgrade('plan')}
              disabled={loadingPlan === 'plan'}
              className="mt-6 w-full bg-amber text-graphite font-semibold py-3 rounded-full hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              {loadingPlan === 'plan' ? 'Redirecting…' : 'Upgrade to Plan'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-amber">
              {plan === 'plan' ? 'Your current plan' : 'Included in your plan'}
            </div>
          )}
        </div>

        <div className="border border-graphite/10 rounded-3xl p-8 bg-chalk shadow-sm">
          <div className="text-xs font-mono uppercase tracking-wide text-amber-deep font-semibold mb-4">Advisor</div>
          <div className="font-display text-3xl font-medium mb-1">
            $149<span className="text-sm font-sans text-slate">/mo</span>
          </div>
          <p className="text-sm text-slate mb-6">For advisors managing a full client book.</p>
          <ul className="text-sm space-y-2.5">
            <li className="flex gap-2"><span className="text-amber-deep font-bold">✓</span> Everything in Plan</li>
            <li className="flex gap-2"><span className="text-amber-deep font-bold">✓</span> Unlimited client profiles*</li>
            <li className="flex gap-2"><span className="text-amber-deep font-bold">✓</span> Client-ready PDF reports*</li>
          </ul>
          {plan !== 'advisor' ? (
            <button
              onClick={() => handleUpgrade('advisor')}
              disabled={loadingPlan === 'advisor'}
              className="mt-6 w-full bg-graphite text-chalk font-semibold py-3 rounded-full hover:bg-amber hover:text-graphite transition-colors disabled:opacity-60"
            >
              {loadingPlan === 'advisor' ? 'Redirecting…' : 'Upgrade to Advisor'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-slate">Your current plan</div>
          )}
          <p className="text-[10px] text-slate mt-4">*Multi-client dashboard not yet built — billing works today, the feature is a later phase.</p>
        </div>
      </div>
    </main>
  )
}
