import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan } from '../lib/billing'

interface Props {
  children: ReactNode
  feature: string // short description shown in the upsell, e.g. "Spousal & survivor coordination"
}

/**
 * Wraps a paid feature. Renders children only if the signed-in user has an
 * active paid plan; otherwise shows a consistent upsell card. Plan status
 * comes from usePlan(), which reads Firestore in real time - so this
 * updates automatically right after a successful checkout, no reload needed.
 */
export default function UpgradeGate({ children, feature }: Props) {
  const { user } = useAuth()
  const { plan } = usePlan(user?.uid)
  const navigate = useNavigate()

  if (plan === 'plan' || plan === 'advisor') {
    return <>{children}</>
  }

  return (
    <div className="bg-chalk-dim border border-graphite/10 rounded-3xl p-10 text-center">
      <div className="text-xs font-mono uppercase tracking-wide text-amber-deep mb-3">
        Plan feature
      </div>
      <h3 className="font-display text-xl font-medium mb-2">{feature} is part of the Plan tier</h3>
      <p className="text-sm text-slate max-w-md mx-auto mb-6 leading-relaxed">
        Upgrade to unlock this along with the AI assistant, document reader, and annual rule-change
        alerts — $12/month.
      </p>
      <button
        onClick={() => navigate('/billing')}
        className="bg-amber text-graphite font-semibold px-6 py-3 rounded-full shadow-sm hover:shadow-amber hover:-translate-y-0.5 transition-all"
      >
        See plans
      </button>
    </div>
  )
}
