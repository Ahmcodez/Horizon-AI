import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
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
      console.error('[MyClaimAge] Sign-in/sign-up failed:', err)
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      style={{ fontFamily: 'var(--font-jakarta)', background: 'var(--chalk-dim, #F8FAFC)' }}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
    >
      <div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.14), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.10), transparent 70%)' }}
      />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 text-[15px] font-normal tracking-tight mb-2 uppercase"
            style={{ color: 'var(--graphite, #0F172A)' }}
          >
            MyClaimAge
          </div>
          <p className="text-sm" style={{ color: 'var(--slate, #64748B)' }}>
            {mode === 'signin' ? 'Welcome back.' : 'Create your account to save your numbers.'}
          </p>
        </div>

        <div
          className="rounded-[15px] p-8"
          style={{
            background: 'var(--chalk, #FFFFFF)',
            border: '1px solid var(--chalk-line-strong, rgba(15,23,42,0.14))',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(15,23,42,0.08))',
          }}
        >
          {/* Sliding tab toggle */}
          <div
            className="relative flex gap-2 mb-7 rounded-[5px] p-1"
            style={{ background: 'var(--chalk-dim, #F8FAFC)', border: '1px solid var(--chalk-line, rgba(15,23,42,0.09))' }}
          >
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[3px] transition-transform duration-300 vivid-ease"
              style={{
                transform: mode === 'signin' ? 'translateX(0%)' : 'translateX(calc(100% + 8px))',
                background: 'var(--chalk, #FFFFFF)',
                boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(15,23,42,0.08))',
              }}
            />
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="relative z-10 flex-1 py-2 rounded-[3px] text-sm font-normal uppercase transition-colors"
              style={{ color: mode === 'signin' ? 'var(--graphite, #0F172A)' : 'var(--slate, #64748B)' }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="relative z-10 flex-1 py-2 rounded-[3px] text-sm font-normal uppercase transition-colors"
              style={{ color: mode === 'signup' ? 'var(--graphite, #0F172A)' : 'var(--slate, #64748B)' }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-normal block mb-2" style={{ color: 'var(--graphite, #0F172A)' }}>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[5px] px-4 py-3 text-base outline-none transition-colors"
                style={{
                  background: 'var(--chalk, #FFFFFF)',
                  border: '1px solid var(--chalk-line-strong, rgba(15,23,42,0.14))',
                  color: 'var(--graphite, #0F172A)',
                }}
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal block mb-2" style={{ color: 'var(--graphite, #0F172A)' }}>Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[5px] px-4 py-3 text-base outline-none transition-colors"
                style={{
                  background: 'var(--chalk, #FFFFFF)',
                  border: '1px solid var(--chalk-line-strong, rgba(15,23,42,0.14))',
                  color: 'var(--graphite, #0F172A)',
                }}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && (
              <div
                className="text-sm rounded-[5px] px-4 py-3"
                style={{ color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="lp-gradient-btn w-full py-3.5"
            >
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--slate, #64748B)' }}>
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
    case 'auth/too-many-requests':
      return 'Too many attempts — please wait a bit and try again.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.'
    case 'auth/unauthorized-domain':
      return 'This site isn\'t yet authorized for sign-in (check Firebase Console → Authentication → Settings → Authorized domains).'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in isn\'t enabled for this project yet (check Firebase Console → Authentication → Sign-in method).'
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/invalid-api-key':
      return 'This deployment is missing a valid Firebase configuration — contact support.'
    default:
      return code
        ? `Something went wrong (${code}). Please try again.`
        : 'Something went wrong. Please try again.'
  }
}
