import { useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../lib/firebase'
import { useAuth } from '../lib/authContext'
import { useAlerts, markAlertRead, dismissAlert } from '../lib/alerts'

const functions = getFunctions(app)

export default function AlertsPage() {
  const { user } = useAuth()
  const alerts = useAlerts(user?.uid)
  const [seeding, setSeeding] = useState(false)

  async function seedSamples() {
    setSeeding(true)
    try {
      const callable = httpsCallable(functions, 'seedSampleAlerts')
      await callable({})
    } finally {
      setSeeding(false)
    }
  }

  return (
    <main
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="max-w-2xl mx-auto px-8 pt-32 pb-24 bg-paper-dim min-h-screen"
    >
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-gold font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-gold" />
          Rule-change alerts
        </div>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-ink">
          What's changed, and whether it affects you.
        </h1>
        <p className="mt-4 text-muted text-lg leading-relaxed">
          We check SSA, IRS, and CMS daily and only alert you when something relevant to your
          situation actually changes.
        </p>
      </div>

      {alerts.length === 0 && (
        <div className="bg-paper border border-ink/8 shadow-card-light rounded-3xl p-10 text-center text-muted text-sm">
          <p className="mb-5">
            No alerts yet — you'll see something here the next time a rule change affects your
            numbers.
          </p>
          <button
            onClick={seedSamples}
            disabled={seeding}
            className="font-mono text-xs bg-paper-dim border border-ink/10 px-4 py-2 rounded-full hover:border-gold transition-colors disabled:opacity-60"
          >
            {seeding ? 'Loading…' : 'See what this looks like (sample data)'}
          </button>
          <p className="text-[10px] text-muted/70 mt-3 max-w-sm mx-auto leading-relaxed">
            This loads 3 realistic sample alerts to preview the feature — it does not test the
            actual daily SSA/IRS/CMS monitoring, which only produces real alerts after a genuine
            rule change is detected.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={alert.id}
            style={{ animation: `fadeUp 0.4s cubic-bezier(.16,.8,.24,1) ${i * 0.05}s both` }}
            className={`rounded-2xl border p-5 flex items-start gap-4 transition-colors ${
              alert.read ? 'bg-paper border-ink/8' : 'bg-gold/10 border-gold/25'
            }`}
          >
            {!alert.read && <div className="w-2 h-2 rounded-full bg-gold mt-1.5 flex-shrink-0" />}
            <div className="flex-1">
              <p className="text-sm text-ink leading-relaxed">{alert.message}</p>
              <div className="text-xs text-muted font-mono mt-2">
                {new Date(alert.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {!alert.read && user && (
                <button
                  onClick={() => markAlertRead(user.uid, alert.id)}
                  className="text-xs font-mono text-gold hover:text-ink transition-colors"
                >
                  Mark read
                </button>
              )}
              {user && (
                <button
                  onClick={() => dismissAlert(user.uid, alert.id)}
                  className="text-xs font-mono text-muted hover:text-red-500 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
