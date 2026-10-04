import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../lib/authContext'
import {
  useAdvisorDirectory,
  useClientMatches,
  createAdvisorMatch,
  type AdvisorProfile,
} from '../lib/advisorMatching'
import UpgradeGate from '../components/UpgradeGate'
import MatchThread from '../components/MatchThread'
import AdvisorGigCard from '../components/AdvisorGigCard'
import AdvisorDetailModal from '../components/AdvisorDetailModal'

export default function FindAdvisorPage() {
  useEffect(() => {
    document.title = 'Find a Financial Advisor | MyClaimAge'
  }, [])

  return (
    <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
      <main className="max-w-6xl mx-auto px-8 pt-32 pb-24">
        <div className="mb-10 max-w-2xl">
          <div className="text-[14px] uppercase tracking-[0.02em] text-lp-slate mb-5 flex items-center gap-2">
            <span className="w-4 h-[1.5px] bg-lp-slate" />
            Advisor matching
          </div>
          <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-lp-graphite">
            Want a Certified Financial Planner to verify your strategy?
          </h1>
          <p className="mt-4 text-lp-slate text-lg leading-relaxed">
            Match with a licensed U.S. advisor, share your numbers and your question, and talk it
            through right here — no phone tag, no separate sign-up.
          </p>
        </div>

        <UpgradeGate feature="Advisor matching">
          <FindAdvisorContent />
        </UpgradeGate>
      </main>
    </div>
  )
}

function FindAdvisorContent() {
  const { user } = useAuth()
  const { advisors, loading, error: directoryError } = useAdvisorDirectory()
  const { matches, error: matchesError } = useClientMatches(user?.uid)
  const [selected, setSelected] = useState<AdvisorProfile | null>(null)

  const matchedAdvisorUids = new Set(matches.map((m) => m.advisorUid))

  return (
    <div className="space-y-10">
      {matches.length > 0 && (
        <section>
          <h2 className="text-xl font-normal text-lp-graphite mb-4">Your conversations</h2>
          {matchesError && (
            <div className="text-sm text-lp-bad bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-5 py-4 mb-4">
              {matchesError}
            </div>
          )}
          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.id} className="gig-card rounded-[15px] overflow-hidden">
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-normal text-lp-graphite">{m.advisorName}</div>
                    <div className="text-xs text-lp-slate mt-0.5 truncate">
                      {m.lastSenderRole === 'advisor' ? 'They said: ' : 'You said: '}
                      {m.lastMessagePreview}
                    </div>
                  </div>
                  {m.resolved && (
                    <span className="text-[10px] uppercase tracking-wide border border-lp-line-strong text-lp-slate px-2 py-1 rounded-[5px] whitespace-nowrap">
                      Resolved
                    </span>
                  )}
                </div>
                {user && <MatchThread matchId={m.id} viewerUid={user.uid} viewerRole="client" />}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-normal text-lp-graphite mb-4">
          {matches.length > 0 ? 'Match with another advisor' : 'Available advisors'}
        </h2>

        {loading && <p className="text-sm text-lp-slate">Loading advisors…</p>}

        {directoryError && (
          <div className="text-sm text-lp-bad bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-5 py-4">
            {directoryError}
          </div>
        )}

        {!loading && !directoryError && advisors.length === 0 && (
          <div className="bg-lp-chalk border border-lp-line-strong rounded-[15px] p-12 text-center text-lp-slate text-sm">
            No advisors are accepting new clients right now — check back soon.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {advisors.map((advisor) => (
            <AdvisorTile
              key={advisor.advisorUid}
              advisor={advisor}
              alreadyMatched={matchedAdvisorUids.has(advisor.advisorUid)}
              onOpen={() => setSelected(advisor)}
            />
          ))}
        </div>
      </section>

      {selected && (
        <AdvisorDetailModal onClose={() => setSelected(null)}>
          <AdvisorCardDetail
            advisor={selected}
            alreadyMatched={matchedAdvisorUids.has(selected.advisorUid)}
          />
        </AdvisorDetailModal>
      )}
    </div>
  )
}

/** One tile in the 3-per-row directory grid - a condensed preview that opens the full profile on click. */
function AdvisorTile({
  advisor,
  alreadyMatched,
  onOpen,
}: {
  advisor: AdvisorProfile
  alreadyMatched: boolean
  onOpen: () => void
}) {
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="gig-card gig-card-clickable rounded-[15px] p-6 flex flex-col"
    >
      <AdvisorGigCard profile={advisor} compact />
      <div className="mt-5 pt-4 border-t border-lp-line text-center">
        {alreadyMatched ? (
          <span className="text-xs text-lp-slate">Already in conversation — see above</span>
        ) : (
          <span className="lp-gradient-btn px-4 py-2 text-xs inline-flex">View profile &amp; message</span>
        )}
      </div>
    </div>
  )
}

/** The complete profile shown inside the detail modal - full bio, every specialty, and the message-request form. */
function AdvisorCardDetail({ advisor, alreadyMatched }: { advisor: AdvisorProfile; alreadyMatched: boolean }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSending(true)
    setError(null)
    try {
      await createAdvisorMatch({
        clientUid: user.uid,
        clientName: name.trim() || user.email || 'A MyClaimAge member',
        clientEmail: user.email ?? '',
        advisorUid: advisor.advisorUid,
        advisorName: advisor.displayName,
        message: message.trim(),
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <AdvisorGigCard profile={advisor} />

      <div className="mt-5 pt-5 border-t border-lp-line">
        {alreadyMatched ? (
          <div className="text-xs text-lp-slate">
            You've already reached out — see your conversation above.
          </div>
        ) : sent ? (
          <div className="text-sm text-lp-good">Sent — {advisor.displayName.split(' ')[0]} will see this on their dashboard.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-xs text-lp-slate block mb-1">Your name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="gig-field-bg w-full border rounded-[5px] px-3 py-2 text-sm focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
              />
            </label>
            <label className="block">
              <span className="text-xs text-lp-slate block mb-1">Tell them about your situation</span>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. I'm 63, married, trying to decide whether to claim now or wait until 70…"
                className="gig-field-bg w-full border rounded-[5px] px-3 py-2 text-sm focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
              />
            </label>
            {error && <div className="text-xs text-lp-bad">{error}</div>}
            <div className="flex gap-2">
              <button type="submit" disabled={sending} className="lp-gradient-btn px-5 py-2 text-sm disabled:opacity-50">
                {sending ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
