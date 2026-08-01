import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { hasCompletedOnboarding } from '../lib/profileStore'

export default function RootRedirect() {
  const { user } = useAuth() // ProtectedRoute guarantees user is non-null here
  const [target, setTarget] = useState<'onboarding' | 'calculator' | null>(null)

  useEffect(() => {
    if (!user) return
    hasCompletedOnboarding(user.uid)
      .then((done) => {
        setTarget(done ? 'calculator' : 'onboarding')
      })
      .catch((err) => {
        console.error('Failed to check onboarding status from Firestore:', err)
        // Fail safe: send to onboarding rather than hanging forever. If
        // Firestore reads are broken (e.g. rules not deployed), onboarding
        // will still render and its own save action will surface a clear
        // error message instead of silently getting stuck.
        setTarget('onboarding')
      })
  }, [user])

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-dim">
        <div className="font-mono text-sm text-muted" style={{ fontFamily: 'var(--font-luxe-mono)' }}>Loading…</div>
      </div>
    )
  }

  return <Navigate to={target === 'onboarding' ? '/onboarding' : '/calculator'} replace />
}
