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
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="min-h-screen flex items-center justify-center px-6 bg-vivid-obsidian relative overflow-hidden"
    >
      <div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(73,87,100,0.30), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(73,87,100,0.18), transparent 70%)' }}
      />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-[15px] font-normal tracking-tight mb-2 text-bone-white uppercase">
            Horizon
          </div>
          <p className="text-fog-blue text-sm">
            {mode === 'signin' ? 'Welcome back.' : 'Create your account to save your numbers.'}
          </p>
        </div>

        <div className="bg-graphite-veil/30 border border-ash-border rounded-[15px] p-8">
          {/* Sliding tab toggle */}
          <div className="relative flex gap-2 mb-7 bg-vivid-obsidian border border-ash-border rounded-[5px] p-1">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-graphite-veil/60 rounded-[3px] transition-transform duration-300 vivid-ease"
              style={{ transform: mode === 'signin' ? 'translateX(0%)' : 'translateX(calc(100% + 8px))' }}
            />
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`relative z-10 flex-1 py-2 rounded-[3px] text-sm font-normal uppercase transition-colors ${
                mode === 'signin' ? 'text-bone-white' : 'text-fog-blue'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`relative z-10 flex-1 py-2 rounded-[3px] text-sm font-normal uppercase transition-colors ${
                mode === 'signup' ? 'text-bone-white' : 'text-fog-blue'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-normal text-bone-white/80 block mb-2">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 text-base focus:border-bone-white outline-none transition-colors text-bone-white"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal text-bone-white/80 block mb-2">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 text-base focus:border-bone-white outline-none transition-colors text-bone-white"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && (
              <div className="text-sm text-bone-white bg-vivid-obsidian border border-bone-white/40 rounded-[5px] px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="ov-outlined-btn w-full py-3.5"
            >
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-fog-blue mt-6 leading-relaxed max-w-sm mx-auto">
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
