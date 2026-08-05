import { useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../lib/firebase'
import { useAuth } from '../lib/authContext'
import { useAlerts, markAlertRead, dismissAlert } from '../lib/alerts'
import { POLICY_NEWS } from '../lib/policyNews'

const functions = getFunctions(app)

export default function AlertsPage() {
  useEffect(() => {
    document.title = 'Rule-Change Alerts — SSA, IRS & Medicare Updates | Horizon'
  }, [])

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
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-2xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-fog-blue" />
          Rule-change alerts
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white">
          What's changed, and whether it affects you.
        </h1>
        <p className="mt-4 text-fog-blue text-lg leading-relaxed">
          We check SSA, IRS, and CMS daily and only alert you when something relevant to your
          situation actually changes.
        </p>
      </div>

      {alerts.length === 0 && (
        <div className="bg-graphite-veil/20 border border-ash-border rounded-[15px] p-10 text-center text-fog-blue text-sm">
          <p className="mb-5">
            No alerts yet — you'll see something here the next time a rule change affects your
            numbers.
          </p>
          <button
            onClick={seedSamples}
            disabled={seeding}
            className="font-mono text-xs bg-vivid-obsidian border border-ash-border px-4 py-2 rounded-[5px] hover:border-bone-white transition-colors disabled:opacity-60 text-bone-white"
          >
            {seeding ? 'Loading…' : 'See what this looks like (sample data)'}
          </button>
          <p className="text-[10px] text-fog-blue/70 mt-3 max-w-sm mx-auto leading-relaxed">
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
            className={`rounded-[15px] border p-5 flex items-start gap-4 transition-colors ${
              alert.read ? 'bg-graphite-veil/10 border-ash-border' : 'bg-graphite-veil/30 border-bone-white/40'
            }`}
          >
            {!alert.read && <div className="w-2 h-2 rounded-full bg-bone-white mt-1.5 flex-shrink-0" />}
            <div className="flex-1">
              <p className="text-sm text-bone-white leading-relaxed">{alert.message}</p>
              <div className="text-xs text-fog-blue font-mono mt-2">
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
                  className="text-xs font-mono text-bone-white hover:text-fog-blue transition-colors"
                >
                  Mark read
                </button>
              )}
              {user && (
                <button
                  onClick={() => dismissAlert(user.uid, alert.id)}
                  className="text-xs font-mono text-fog-blue hover:text-bone-white transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <PolicyNewsSection />
    </main>
  )
}

function PolicyNewsSection() {
  const recent = POLICY_NEWS.filter((n) => n.category === 'recent')
  const upcoming = POLICY_NEWS.filter((n) => n.category === 'upcoming')

  return (
    <div className="mt-16 pt-12 border-t border-ash-border">
      <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-2 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-fog-blue" />
        General policy news
      </div>
      <p className="text-fog-blue text-sm leading-relaxed mb-8 max-w-lg">
        These aren't personalized to your record — they're the broader SSA, CMS, and Trustees
        Report changes everyone planning around Social Security should know about.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="text-xs uppercase tracking-[0.02em] text-bone-white font-normal mb-4">Recent</div>
          <div className="space-y-4">
            {recent.map((item) => (
              <PolicyNewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.02em] text-bone-white font-normal mb-4">Upcoming</div>
          <div className="space-y-4">
            {upcoming.map((item) => (
              <PolicyNewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PolicyNewsCard({ item }: { item: (typeof POLICY_NEWS)[number] }) {
  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-graphite-veil/15 border border-ash-border rounded-[10px] p-4 hover:border-bone-white/40 transition-colors"
    >
      <div className="text-[11px] font-mono text-fog-blue mb-1.5">{item.date} · {item.source}</div>
      <div className="text-sm text-bone-white font-normal mb-1.5">{item.title}</div>
      <p className="text-xs text-fog-blue leading-relaxed">{item.description}</p>
    </a>
  )
}
