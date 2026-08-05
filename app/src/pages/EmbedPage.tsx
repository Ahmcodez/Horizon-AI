import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan } from '../lib/billing'

const FUNCTION_URL_PLACEHOLDER = 'https://us-central1-YOUR-PROJECT.cloudfunctions.net/embedCalculate'

export default function EmbedPage() {
  useEffect(() => {
    document.title = 'Embeddable Widget — License the Calculator | Horizon'
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
      <main
        style={{ fontFamily: 'var(--font-vivid)' }}
        className="max-w-2xl mx-auto px-8 pt-32 pb-24 text-center bg-vivid-obsidian min-h-screen"
      >
        <div className="bg-graphite-veil/30 text-bone-white border border-ash-border rounded-[15px] p-12">
          <div className="text-xs uppercase tracking-[0.02em] text-fog-blue mb-3">Advisor tier</div>
          <h1 className="text-2xl font-normal mb-3">The embeddable widget is part of the Advisor plan</h1>
          <p className="text-sm text-bone-white/60 mb-6 max-w-md mx-auto leading-relaxed">
            License the claiming-age calculator to run directly on your own website — $149/month.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="ov-outlined-btn px-6 py-3"
          >
            See plans
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-3xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-fog-blue" />
          Embeddable widget
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white">
          Put the calculator on your own site.
        </h1>
        <p className="mt-4 text-fog-blue text-lg leading-relaxed">
          A lightweight, no-login widget your visitors can use directly — powered by the same
          calculation engine as the rest of Horizon.
        </p>
      </div>

      <div className="bg-graphite-veil/20 border border-ash-border text-bone-white rounded-[15px] p-6 mb-4 relative">
        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{snippet}</pre>
        <button
          onClick={copySnippet}
          className="ov-outlined-btn absolute top-4 right-4 text-xs px-3 py-1.5"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-fog-blue mb-10">
        Replace <code className="bg-vivid-obsidian border border-ash-border px-1.5 py-0.5 rounded-[3px] text-bone-white">YOUR-PROJECT</code> with your deployed
        Cloud Function URL (visible in the Firebase console after deploying) and{' '}
        <code className="bg-vivid-obsidian border border-ash-border px-1.5 py-0.5 rounded-[3px] text-bone-white">YOUR-HORIZON-DOMAIN</code> with wherever{' '}
        <code className="bg-vivid-obsidian border border-ash-border px-1.5 py-0.5 rounded-[3px] text-bone-white">embed.js</code> is hosted.
      </p>

      <div className="border-t border-ash-border pt-10">
        <h2 className="text-xl font-normal mb-5 text-bone-white">Live preview</h2>
        <div id="horizon-widget" ref={previewRef} />
      </div>

      <p className="text-xs text-fog-blue leading-relaxed mt-10">
        The widget calls a public, unauthenticated endpoint that performs the claiming-age
        calculation only — no visitor data is stored, and it never touches your client records or
        any part of your Horizon account.
      </p>
    </main>
  )
}
