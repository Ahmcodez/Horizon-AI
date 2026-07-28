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
      <main className="max-w-2xl mx-auto px-8 pt-32 pb-24 text-center">
        <div className="bg-chalk-dim border border-graphite/10 rounded-3xl p-12">
          <div className="text-xs font-mono uppercase tracking-wide text-amber-deep mb-3">Advisor tier</div>
          <h1 className="font-display text-2xl font-medium mb-3">The embeddable widget is part of the Advisor plan</h1>
          <p className="text-sm text-slate mb-6 max-w-md mx-auto leading-relaxed">
            License the claiming-age calculator to run directly on your own website — $149/month.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="bg-amber text-graphite font-semibold px-6 py-3 rounded-full shadow-sm hover:shadow-amber hover:-translate-y-0.5 transition-all"
          >
            See plans
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-8 pt-32 pb-24">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-amber-deep" />
          Embeddable widget
        </div>
        <h1 className="font-display text-4xl font-normal tracking-tight leading-tight">
          Put the calculator on your own site.
        </h1>
        <p className="mt-4 text-slate text-lg leading-relaxed">
          A lightweight, no-login widget your visitors can use directly — powered by the same
          calculation engine as the rest of Horizon.
        </p>
      </div>

      <div className="bg-graphite text-chalk rounded-2xl p-6 mb-4 relative">
        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{snippet}</pre>
        <button
          onClick={copySnippet}
          className="absolute top-4 right-4 text-xs font-mono bg-amber text-graphite px-3 py-1.5 rounded-full font-semibold"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-slate mb-10">
        Replace <code className="bg-chalk-dim px-1.5 py-0.5 rounded">YOUR-PROJECT</code> with your deployed
        Cloud Function URL (visible in the Firebase console after deploying) and{' '}
        <code className="bg-chalk-dim px-1.5 py-0.5 rounded">YOUR-HORIZON-DOMAIN</code> with wherever
        <code className="bg-chalk-dim px-1.5 py-0.5 rounded">embed.js</code> is hosted.
      </p>

      <div className="border-t border-graphite/10 pt-10">
        <h2 className="font-display text-xl font-medium mb-5">Live preview</h2>
        <div id="horizon-widget" ref={previewRef} />
      </div>

      <p className="text-xs text-slate leading-relaxed mt-10">
        The widget calls a public, unauthenticated endpoint that performs the claiming-age
        calculation only — no visitor data is stored, and it never touches your client records or
        any part of your Horizon account.
      </p>
    </main>
  )
}
