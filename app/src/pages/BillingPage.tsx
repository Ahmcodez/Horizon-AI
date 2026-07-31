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
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="max-w-4xl mx-auto px-8 pt-32 pb-24 bg-paper-dim min-h-screen"
    >
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gold font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-gold" />
          Billing
        </div>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-ink">Your plan</h1>
        <p className="mt-4 text-muted text-lg leading-relaxed">
          Currently on the <span className="font-semibold text-ink capitalize">{plan}</span>{' '}
          plan{status ? ` (${status})` : ''}.
        </p>
      </div>

      {checkoutResult === 'success' && (
        <div className="bg-emerald/10 border border-emerald/25 rounded-2xl px-5 py-4 mb-8 text-sm text-ink">
          Payment received — your plan updates automatically within a few seconds.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="bg-paper border border-ink/8 rounded-2xl px-5 py-4 mb-8 text-sm text-muted">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 rounded-2xl px-5 py-4 mb-8 text-sm">{error}</div>
      )}

      {(plan === 'plan' || plan === 'advisor') && (
        <div className="mb-10">
          <button
            onClick={handleManage}
            disabled={loadingPlan === 'portal'}
            className="bg-obsidian text-paper font-semibold px-6 py-3 rounded-full hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-60"
          >
            {loadingPlan === 'portal' ? 'Opening…' : 'Manage billing / cancel'}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        <div className="border border-ink/8 rounded-3xl p-8 bg-paper shadow-card-light hover:-translate-y-1 transition-transform">
          <div className="text-xs font-mono uppercase tracking-wide text-muted font-semibold mb-4">Free</div>
          <div className="text-3xl font-semibold mb-1 text-ink">$0</div>
          <p className="text-sm text-muted mb-6">A real first look at your options.</p>
          <ul className="text-sm space-y-2.5 text-ink">
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Single claiming-age estimate</li>
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> FRA &amp; delayed credit calculation</li>
          </ul>
          {plan === 'free' && <div className="mt-6 text-xs font-mono text-muted">Your current plan</div>}
        </div>

        <div className="rounded-3xl p-8 bg-obsidian-elevated text-paper shadow-card-dark relative border border-gold/20 hover:-translate-y-1 transition-transform">
          <div className="absolute -top-3 right-7 bg-gold text-obsidian text-[11px] font-mono font-bold px-3 py-1.5 rounded-full">
            Most chosen
          </div>
          <div className="text-xs font-mono uppercase tracking-wide text-gold font-semibold mb-4">Plan</div>
          <div className="text-3xl font-semibold mb-1">
            $12<span className="text-sm font-normal text-paper/50">/mo</span>
          </div>
          <p className="text-sm text-paper/60 mb-6">The full picture, kept current every year.</p>
          <ul className="text-sm space-y-2.5">
            <li className="flex gap-2"><span className="text-gold font-bold">✓</span> Spousal &amp; survivor coordination</li>
            <li className="flex gap-2"><span className="text-gold font-bold">✓</span> WEP/GPO-aware calculations</li>
            <li className="flex gap-2"><span className="text-gold font-bold">✓</span> AI assistant &amp; document reader</li>
          </ul>
          {plan === 'free' ? (
            <button
              onClick={() => handleUpgrade('plan')}
              disabled={loadingPlan === 'plan'}
              className="mt-6 w-full bg-gold text-obsidian font-semibold py-3 rounded-full hover:-translate-y-0.5 hover:shadow-glow-gold transition-all disabled:opacity-60"
            >
              {loadingPlan === 'plan' ? 'Redirecting…' : 'Upgrade to Plan'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-gold">
              {plan === 'plan' ? 'Your current plan' : 'Included in your plan'}
            </div>
          )}
        </div>

        <div className="border border-ink/8 rounded-3xl p-8 bg-paper shadow-card-light hover:-translate-y-1 transition-transform">
          <div className="text-xs font-mono uppercase tracking-wide text-muted font-semibold mb-4">Advisor</div>
          <div className="text-3xl font-semibold mb-1 text-ink">
            $149<span className="text-sm font-normal text-muted">/mo</span>
          </div>
          <p className="text-sm text-muted mb-6">For advisors managing a full client book.</p>
          <ul className="text-sm space-y-2.5 text-ink">
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Everything in Plan</li>
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Unlimited client profiles</li>
            <li className="flex gap-2"><span className="text-emerald font-bold">✓</span> Embeddable calculator widget</li>
          </ul>
          {plan !== 'advisor' ? (
            <button
              onClick={() => handleUpgrade('advisor')}
              disabled={loadingPlan === 'advisor'}
              className="mt-6 w-full bg-obsidian text-paper font-semibold py-3 rounded-full hover:bg-gold hover:text-obsidian transition-colors disabled:opacity-60"
            >
              {loadingPlan === 'advisor' ? 'Redirecting…' : 'Upgrade to Advisor'}
            </button>
          ) : (
            <div className="mt-6 text-xs font-mono text-muted">Your current plan</div>
          )}
        </div>
      </div>
    </main>
  )
}
