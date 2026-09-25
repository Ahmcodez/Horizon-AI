import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan } from '../lib/billing'

const FUNCTION_URL_PLACEHOLDER = 'https://us-central1-YOUR-PROJECT.cloudfunctions.net/embedCalculate'

export default function EmbedPage() {
  useEffect(() => {
    document.title = 'Embeddable Widget — License the Calculator | MyClaimAge'
  }, [])

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
      <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
      <main
        className="max-w-2xl mx-auto px-8 pt-32 pb-24 text-center"
      >
        <div className="hover-glow-lp bg-lp-chalk text-lp-graphite border border-lp-line-strong rounded-[15px] p-12">
          <div className="text-xs uppercase tracking-[0.02em] text-lp-slate mb-3">Advisor tier</div>
          <h1 className="text-2xl font-normal mb-3">The embeddable widget is part of the Advisor plan</h1>
          <p className="text-sm text-lp-slate mb-6 max-w-md mx-auto leading-relaxed">
            License the claiming-age calculator to run directly on your own website — $149/month.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="lp-gradient-btn px-6 py-3"
          >
            See plans
          </button>
        </div>
      </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
    <main
      className="max-w-3xl mx-auto px-8 pt-32 pb-24"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-lp-slate mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-lp-slate" />
          Embeddable widget
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-lp-graphite">
          Put the calculator on your own site.
        </h1>
        <p className="mt-4 text-lp-slate text-lg leading-relaxed">
          A lightweight, no-login widget your visitors can use directly — powered by the same
          calculation engine as the rest of MyClaimAge.
        </p>
      </div>

      <div className="hover-glow-lp bg-lp-chalk border border-lp-line-strong text-lp-graphite rounded-[15px] p-6 mb-4 relative">
        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{snippet}</pre>
        <button
          onClick={copySnippet}
          className="ov-outlined-btn-lp absolute top-4 right-4 text-xs px-3 py-1.5"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-lp-slate mb-10">
        Replace <code className="bg-lp-chalk-dim border border-lp-line-strong px-1.5 py-0.5 rounded-[3px] text-lp-graphite">YOUR-PROJECT</code> with your deployed
        Cloud Function URL (visible in the Firebase console after deploying) and{' '}
        <code className="bg-lp-chalk-dim border border-lp-line-strong px-1.5 py-0.5 rounded-[3px] text-lp-graphite">YOUR-HORIZON-DOMAIN</code> with wherever{' '}
        <code className="bg-lp-chalk-dim border border-lp-line-strong px-1.5 py-0.5 rounded-[3px] text-lp-graphite">embed.js</code> is hosted.
      </p>

      <div className="border-t border-lp-line-strong pt-10">
        <h2 className="text-xl font-normal mb-5 text-lp-graphite">Live preview</h2>
        <div id="horizon-widget" ref={previewRef} />
      </div>

      <p className="text-xs text-lp-slate leading-relaxed mt-10">
        The widget calls a public, unauthenticated endpoint that performs the claiming-age
        calculation only — no visitor data is stored, and it never touches your client records or
        any part of your MyClaimAge account.
      </p>
    </main>
    </div>
  )
}
