import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan } from '../lib/billing'

/**
 * Wraps a paid feature. Renders children only if the signed-in user has an
 * active paid plan; otherwise shows a consistent upsell card. Plan status
 * comes from usePlan(), which reads Firestore in real time - so this
 * updates automatically right after a successful checkout, no reload needed.
 */
export default function UpgradeGate({ children, feature }: { children: ReactNode; feature: string }) {
  const { user } = useAuth()
  const { plan } = usePlan(user?.uid)
  const navigate = useNavigate()

  if (plan === 'plan' || plan === 'advisor') {
    return <>{children}</>
  }

  return (
    <div
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="bg-graphite-veil/30 border border-ash-border rounded-[15px] p-10 text-center"
    >
      <div className="text-xs uppercase tracking-[0.02em] text-fog-blue mb-3">
        Plan feature
      </div>
      <h3 className="text-xl font-normal mb-2 text-bone-white">{feature} is part of the Plan tier</h3>
      <p className="text-sm text-bone-white/60 max-w-md mx-auto mb-6 leading-relaxed">
        Upgrade to unlock this along with the AI assistant, document reader, and annual rule-change
        alerts — $12/month.
      </p>
      <button onClick={() => navigate('/billing')} className="ov-outlined-btn">
        See plans
      </button>
    </div>
  )
}
