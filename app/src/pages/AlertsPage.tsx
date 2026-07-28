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
    <main className="max-w-2xl mx-auto px-8 pt-32 pb-24">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-amber-deep" />
          Rule-change alerts
        </div>
        <h1 className="font-display text-4xl font-normal tracking-tight leading-tight">
          What's changed, and whether it affects you.
        </h1>
        <p className="mt-4 text-slate text-lg leading-relaxed">
          We check SSA, IRS, and CMS daily and only alert you when something relevant to your
          situation actually changes.
        </p>
      </div>

      {alerts.length === 0 && (
        <div className="bg-chalk-dim rounded-3xl p-10 text-center text-slate text-sm">
          <p className="mb-5">
            No alerts yet — you'll see something here the next time a rule change affects your
            numbers.
          </p>
          <button
            onClick={seedSamples}
            disabled={seeding}
            className="font-mono text-xs bg-chalk border border-graphite/15 px-4 py-2 rounded-full hover:border-amber-deep transition-colors disabled:opacity-60"
          >
            {seeding ? 'Loading…' : 'See what this looks like (sample data)'}
          </button>
          <p className="text-[10px] text-slate/70 mt-3 max-w-sm mx-auto leading-relaxed">
            This loads 3 realistic sample alerts to preview the feature — it does not test the
            actual daily SSA/IRS/CMS monitoring, which only produces real alerts after a genuine
            rule change is detected.
          </p>
        </div>
      )}


      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-2xl border p-5 flex items-start gap-4 ${
              alert.read ? 'bg-chalk border-graphite/10' : 'bg-amber/10 border-amber-deep/20'
            }`}
          >
            {!alert.read && <div className="w-2 h-2 rounded-full bg-amber mt-1.5 flex-shrink-0" />}
            <div className="flex-1">
              <p className="text-sm text-graphite leading-relaxed">{alert.message}</p>
              <div className="text-xs text-slate font-mono mt-2">
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
                  className="text-xs font-mono text-amber-deep hover:text-graphite transition-colors"
                >
                  Mark read
                </button>
              )}
              {user && (
                <button
                  onClick={() => dismissAlert(user.uid, alert.id)}
                  className="text-xs font-mono text-slate hover:text-warn transition-colors"
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
