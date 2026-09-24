import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { useAlerts, markAlertRead, dismissAlert, seedSampleAlerts } from '../lib/alerts'
import { POLICY_NEWS, useDailyDigest, useDigestStatus } from '../lib/policyNews'

export default function AlertsPage() {
  useEffect(() => {
    document.title = 'Rule-Change Alerts — SSA, IRS & Medicare Updates | MyClaimAge'
  }, [])

  const { user } = useAuth()
  const alerts = useAlerts(user?.uid)
  const [seeding, setSeeding] = useState(false)

  async function seedSamples() {
    setSeeding(true)
    try {
      await seedSampleAlerts()
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
    <main
      className="max-w-6xl mx-auto px-8 pt-32 pb-24"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-lp-slate mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-lp-slate" />
          Rule-change alerts
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-lp-graphite max-w-2xl">
          What's changed, and whether it affects you.
        </h1>
        <p className="mt-4 text-lp-slate text-lg leading-relaxed max-w-2xl">
          We check SSA, IRS, and CMS daily and only alert you when something relevant to your
          situation actually changes.
        </p>
      </div>

      <section className="bg-lp-chalk border-2 border-[var(--color-lp-cyan)]/40 rounded-[15px] p-8 shadow-[0_0_35px_rgba(56,189,248,0.15)]">
        {alerts.length === 0 && (
          <div className="text-center text-lp-slate text-sm py-6">
            <p className="mb-5">
              No alerts yet — you'll see something here the next time a rule change affects your
              numbers.
            </p>
            <button
              onClick={seedSamples}
              disabled={seeding}
              className="font-mono text-xs bg-lp-chalk border-2 border-lp-line-strong px-4 py-2 rounded-[5px] hover:border-[var(--color-lp-cyan)] transition-colors disabled:opacity-60 text-lp-graphite"
            >
              {seeding ? 'Loading…' : 'See what this looks like (sample data)'}
            </button>
            <p className="text-[10px] text-lp-slate/70 mt-3 max-w-sm mx-auto leading-relaxed">
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
              className={`rounded-[10px] border-2 p-5 flex items-start gap-4 transition-all duration-300 ${
                alert.read
                  ? 'bg-lp-chalk border-lp-line-strong'
                  : 'bg-lp-chalk border-[var(--color-lp-cyan)]/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
              }`}
            >
              {!alert.read && <div className="w-2 h-2 rounded-full bg-[var(--color-lp-cyan)] mt-1.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-sm text-lp-graphite leading-relaxed">{alert.message}</p>
                <div className="text-xs text-lp-slate font-mono mt-2">
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
                    className="text-xs font-mono text-[var(--color-lp-cyan)] hover:text-lp-graphite transition-colors"
                  >
                    Mark read
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => dismissAlert(user.uid, alert.id)}
                    className="text-xs font-mono text-lp-slate hover:text-lp-graphite transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <PolicyNewsSection />
    </main>
    </div>
  )
}

function PolicyNewsSection() {
  const recent = POLICY_NEWS.filter((n) => n.category === 'recent')
  const upcoming = POLICY_NEWS.filter((n) => n.category === 'upcoming')
  const live = useDailyDigest()
  const status = useDigestStatus()

  return (
    <section className="mt-10 bg-lp-chalk border-2 border-[var(--color-lp-cyan)]/40 rounded-[15px] p-8 shadow-[0_0_35px_rgba(56,189,248,0.18)]">
      <div className="text-[14px] uppercase tracking-[0.02em] text-lp-slate mb-2 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-lp-slate" />
        General policy news
      </div>
      <p className="text-lp-slate text-sm leading-relaxed mb-10 max-w-xl">
        These aren't personalized to your record — they're the broader SSA, CMS, and Trustees
        Report changes everyone planning around Social Security should know about.
      </p>

      {live.length > 0 ? (
        <div className="mb-12">
          <h2 className="text-2xl font-normal text-lp-graphite mb-1 flex items-center gap-3">
            Today
            <span className="text-[10px] font-mono uppercase tracking-wide border border-[var(--color-lp-cyan)] text-[var(--color-lp-cyan)] px-2 py-0.5 rounded-[3px]">
              live
            </span>
          </h2>
          <p className="text-xs text-lp-slate mb-6">
            Pulled automatically from SSA, IRS, and CMS.
            {status && (
              <span className="text-lp-slate/70">
                {' '}
                · Last checked {formatRelativeTime(status.lastRunAt)} ({status.succeeded}/{status.sourcesChecked} sources)
              </span>
            )}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {live.map((item, i) => (
              <PolicyNewsCard
                key={item.id}
                index={i}
                item={{
                  id: item.id,
                  date: item.date,
                  category: 'recent',
                  title: item.sourceLabel,
                  description: item.summary,
                  source: item.sourceLabel,
                  sourceUrl: item.sourceUrl,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-12 border border-lp-line-strong rounded-[10px] px-5 py-4 text-xs text-lp-slate leading-relaxed">
          {status && status.succeeded === 0 ? (
            <>
              The live monitor ran but every source failed ({status.failed}/{status.sourcesChecked}) —{' '}
              {formatRelativeTime(status.lastRunAt)}. Check the GitHub Actions logs for this repo's
              "Daily SSA/IRS/CMS monitor" workflow for details.
            </>
          ) : (
            <>
              Live daily monitoring hasn't run yet, or hasn't reached this app instance. The curated
              list below still reflects real, verified changes in the meantime.
            </>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-2xl font-normal text-lp-graphite mb-6">Recent</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recent.map((item, i) => (
            <PolicyNewsCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-normal text-lp-graphite mb-6">Upcoming</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {upcoming.map((item, i) => (
            <PolicyNewsCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'less than an hour ago'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function PolicyNewsCard({ item, index }: { item: (typeof POLICY_NEWS)[number]; index: number }) {
  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animation: `fadeUp 0.45s cubic-bezier(.16,.8,.24,1) ${index * 0.07}s both` }}
      className="block bg-lp-chalk border-2 border-lp-line-strong rounded-[10px] p-5 hover:border-[var(--color-lp-cyan)] hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(56,189,248,0.4)] transition-all duration-300"
    >
      <div className="text-[11px] font-mono text-lp-slate mb-2">{item.date} · {item.source}</div>
      <div className="text-sm text-lp-graphite font-normal mb-2 leading-snug">{item.title}</div>
      <p className="text-xs text-lp-slate leading-relaxed">{item.description}</p>
    </a>
  )
}
