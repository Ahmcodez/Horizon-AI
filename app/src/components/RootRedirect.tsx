import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { hasCompletedOnboarding } from '../lib/profileStore'

export default function RootRedirect() {
  const { user } = useAuth() // ProtectedRoute guarantees user is non-null here
  const [target, setTarget] = useState<'onboarding' | 'calculator' | null>(null)

  useEffect(() => {
    if (!user) return
    hasCompletedOnboarding(user.uid).then((done) => {
      setTarget(done ? 'calculator' : 'onboarding')
    })
  }, [user])

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-sm text-slate">Loading…</div>
      </div>
    )
  }

  return <Navigate to={target === 'onboarding' ? '/onboarding' : '/calculator'} replace />
}
