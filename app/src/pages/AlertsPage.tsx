import { useAuth } from '../lib/authContext'
import { useAlerts, markAlertRead, dismissAlert } from '../lib/alerts'

export default function AlertsPage() {
  const { user } = useAuth()
  const alerts = useAlerts(user?.uid)

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
          No alerts yet — you'll see something here the next time a rule change affects your
          numbers.
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
