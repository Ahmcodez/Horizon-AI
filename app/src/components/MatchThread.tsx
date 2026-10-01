import { useState, type FormEvent } from 'react'
import { useMatchMessages, sendMatchMessage } from '../lib/advisorMatching'

/**
 * The message thread for one client<->advisor match. Used on both sides of
 * the conversation - the client's "Find an Advisor" page and the advisor's
 * dashboard - with `viewerRole` deciding which messages align right/left.
 */
export default function MatchThread({
  matchId,
  viewerUid,
  viewerRole,
}: {
  matchId: string
  viewerUid: string
  viewerRole: 'client' | 'advisor'
}) {
  const messages = useMatchMessages(matchId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)
    try {
      await sendMatchMessage(matchId, viewerUid, viewerRole, trimmed)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-lp-line-strong bg-lp-chalk-dim p-5">
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-lp-slate text-center py-4">No messages yet.</p>
        )}
        {messages.map((m) => {
          const isOwn = m.senderRole === viewerRole
          return (
            <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-[10px] px-4 py-2.5 text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-lp-graphite text-lp-chalk'
                    : 'bg-lp-chalk border border-lp-line-strong text-lp-graphite'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <div className={`text-[10px] mt-1 ${isOwn ? 'text-lp-chalk/60' : 'text-lp-slate'}`}>
                  {new Date(m.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="text-xs text-lp-bad bg-[#FEF2F2] border border-[#FECACA] rounded-[5px] px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-2.5 text-sm focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="lp-gradient-btn px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
