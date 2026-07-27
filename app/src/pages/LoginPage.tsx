import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      navigate('/app')
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-display text-2xl font-semibold mb-2">
            <span className="w-[18px] h-[18px] bg-amber rounded-[5px_5px_5px_0]" />
            Horizon
          </div>
          <p className="text-slate text-sm">
            {mode === 'signin' ? 'Welcome back.' : 'Create your account to save your numbers.'}
          </p>
        </div>

        <div className="bg-chalk border border-graphite/10 rounded-3xl p-8 shadow-md">
          <div className="flex gap-2 mb-7 bg-chalk-dim rounded-full p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                mode === 'signin' ? 'bg-graphite text-chalk' : 'text-slate'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-graphite text-chalk' : 'text-slate'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-graphite block mb-2">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-chalk-dim border border-graphite/15 rounded-xl px-4 py-3 text-base focus:border-amber-deep outline-none transition-colors"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-graphite block mb-2">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-chalk-dim border border-graphite/15 rounded-xl px-4 py-3 text-base focus:border-amber-deep outline-none transition-colors"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && (
              <div className="text-sm text-warn bg-warn/10 rounded-lg px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber text-graphite font-semibold py-3.5 rounded-full shadow-sm hover:shadow-amber hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate mt-6 leading-relaxed max-w-sm mx-auto">
          Your Social Security numbers are stored securely and are never shared. Not affiliated
          with the Social Security Administration.
        </p>
      </div>
    </main>
  )
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists — try signing in instead.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/invalid-email':
      return 'That email address doesn\'t look right.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
