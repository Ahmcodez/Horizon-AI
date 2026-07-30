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
    <main
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="min-h-screen flex items-center justify-center px-6 bg-obsidian relative overflow-hidden"
    >
      <div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,183,0,0.14), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)' }}
      />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-semibold mb-2 text-paper">
            <span className="w-[18px] h-[18px] bg-gold rounded-[5px_5px_5px_0]" />
            Horizon
          </div>
          <p className="text-paper/50 text-sm">
            {mode === 'signin' ? 'Welcome back.' : 'Create your account to save your numbers.'}
          </p>
        </div>

        <div className="bg-paper rounded-3xl p-8 shadow-glow-white">
          {/* Sliding tab toggle */}
          <div className="relative flex gap-2 mb-7 bg-paper-dim rounded-full p-1">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-obsidian rounded-full transition-transform duration-300 ease-out"
              style={{ transform: mode === 'signin' ? 'translateX(0%)' : 'translateX(calc(100% + 8px))' }}
            />
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`relative z-10 flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                mode === 'signin' ? 'text-paper' : 'text-muted'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`relative z-10 flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'text-paper' : 'text-muted'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink block mb-2">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-paper-dim border border-ink/10 rounded-xl px-4 py-3 text-base focus:border-gold outline-none transition-colors text-ink"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink block mb-2">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper-dim border border-ink/10 rounded-xl px-4 py-3 text-base focus:border-gold outline-none transition-colors text-ink"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-obsidian text-paper font-semibold py-3.5 rounded-full shadow-card-dark hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.4)] transition-all disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-paper/40 mt-6 leading-relaxed max-w-sm mx-auto">
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
