import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan } from '../lib/billing'

const FUNCTION_URL_PLACEHOLDER = 'https://us-central1-YOUR-PROJECT.cloudfunctions.net/embedCalculate'

export default function EmbedPage() {
  const { user } = useAuth()
  const { plan } = usePlan(user?.uid)
  const navigate = useNavigate()
  const previewRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const snippet = `<div id="horizon-widget" data-endpoint="${FUNCTION_URL_PLACEHOLDER}"></div>
<script src="https://YOUR-HORIZON-DOMAIN.com/embed.js" defer></script>`

  useEffect(() => {
    if (plan !== 'advisor' || !previewRef.current) return
    const script = document.createElement('script')
    script.src = '/embed.js'
    script.defer = true
    document.body.appendChild(script)
    if (previewRef.current) previewRef.current.setAttribute('data-endpoint', FUNCTION_URL_PLACEHOLDER)
    return () => {
      document.body.removeChild(script)
    }
  }, [plan])

  function copySnippet() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (plan !== 'advisor') {
    return (
      <main
        style={{ fontFamily: 'var(--font-luxe)' }}
        className="max-w-2xl mx-auto px-8 pt-32 pb-24 text-center bg-paper-dim min-h-screen"
      >
        <div className="bg-obsidian-elevated text-paper border border-gold/20 rounded-3xl p-12 shadow-card-dark">
          <div className="text-xs font-mono uppercase tracking-wide text-gold mb-3">Advisor tier</div>
          <h1 className="text-2xl font-semibold mb-3">The embeddable widget is part of the Advisor plan</h1>
          <p className="text-sm text-paper/60 mb-6 max-w-md mx-auto leading-relaxed">
            License the claiming-age calculator to run directly on your own website — $149/month.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="bg-gold text-obsidian font-semibold px-6 py-3 rounded-full shadow-glow-gold hover:-translate-y-0.5 transition-all"
          >
            See plans
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="max-w-3xl mx-auto px-8 pt-32 pb-24 bg-paper-dim min-h-screen"
    >
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gold font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-gold" />
          Embeddable widget
        </div>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-ink">
          Put the calculator on your own site.
        </h1>
        <p className="mt-4 text-muted text-lg leading-relaxed">
          A lightweight, no-login widget your visitors can use directly — powered by the same
          calculation engine as the rest of Horizon.
        </p>
      </div>

      <div className="bg-obsidian-elevated text-paper rounded-2xl p-6 mb-4 relative shadow-card-dark">
        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{snippet}</pre>
        <button
          onClick={copySnippet}
          className="absolute top-4 right-4 text-xs font-mono bg-gold text-obsidian px-3 py-1.5 rounded-full font-semibold hover:-translate-y-0.5 transition-transform"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-muted mb-10">
        Replace <code className="bg-paper border border-ink/8 px-1.5 py-0.5 rounded">YOUR-PROJECT</code> with your deployed
        Cloud Function URL (visible in the Firebase console after deploying) and{' '}
        <code className="bg-paper border border-ink/8 px-1.5 py-0.5 rounded">YOUR-HORIZON-DOMAIN</code> with wherever{' '}
        <code className="bg-paper border border-ink/8 px-1.5 py-0.5 rounded">embed.js</code> is hosted.
      </p>

      <div className="border-t border-ink/8 pt-10">
        <h2 className="text-xl font-semibold mb-5 text-ink">Live preview</h2>
        <div id="horizon-widget" ref={previewRef} />
      </div>

      <p className="text-xs text-muted leading-relaxed mt-10">
        The widget calls a public, unauthenticated endpoint that performs the claiming-age
        calculation only — no visitor data is stored, and it never touches your client records or
        any part of your Horizon account.
      </p>
    </main>
  )
}
