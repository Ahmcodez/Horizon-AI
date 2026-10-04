import { useRef, useState, type FormEvent } from 'react'
import { useMatchMessages, sendMatchMessage, type MatchAttachment } from '../lib/advisorMatching'
import { uploadToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary'

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10MB — fine on Cloudinary's free tier, since only the URL lands in Firestore
const ACCEPTED_ATTACHMENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

/**
 * The message thread for one client<->advisor match. Used on both sides of
 * the conversation - the client's "Find an Advisor" page and the advisor's
 * dashboard - with `viewerRole` deciding which messages align right/left.
 * Supports sharing a document or image alongside (or instead of) text, so a
 * client can hand over an SSA statement or an advisor can send back notes
 * without leaving the app.
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleAttach(file: File) {
    setError(null)
    if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
      setError('That file type isn\'t supported — please share a PDF, Word doc, or image.')
      return
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError('That file is too large — please share something under 10MB.')
      return
    }
    if (!isCloudinaryConfigured()) {
      setError('File sharing isn\'t configured yet — ask whoever manages this site to set up Cloudinary.')
      return
    }

    setUploading(true)
    try {
      const resourceType = file.type.startsWith('image/') ? 'image' : 'auto'
      const result = await uploadToCloudinary(file, resourceType)
      const attachment: MatchAttachment = { url: result.url, name: file.name, type: file.type }
      await sendMatchMessage(matchId, viewerUid, viewerRole, text.trim(), attachment)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share that file — please try again.')
    } finally {
      setUploading(false)
    }
  }

  const busy = sending || uploading

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
                {m.attachment && <AttachmentPreview attachment={m.attachment} isOwn={isOwn} />}
                {m.text && <div className="whitespace-pre-line">{m.text}</div>}
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="Attach a document or image"
          title="Attach a document or image"
          className="flex-shrink-0 w-10 h-10 rounded-[5px] border border-lp-line-strong bg-lp-chalk text-lp-slate hover:text-lp-graphite hover:border-lp-graphite transition-colors flex items-center justify-center disabled:opacity-50"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_ATTACHMENT_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleAttach(f)
            e.target.value = ''
          }}
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={uploading ? 'Sharing file…' : 'Write a message…'}
          disabled={uploading}
          className="flex-1 bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-2.5 text-sm focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="lp-gradient-btn px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}

function AttachmentPreview({ attachment, isOwn }: { attachment: MatchAttachment; isOwn: boolean }) {
  const isImage = attachment.type.startsWith('image/')

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block mb-2">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-w-full max-h-48 rounded-[8px] border border-black/10 object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 mb-2 border transition-colors ${
        isOwn
          ? 'border-lp-chalk/30 hover:border-lp-chalk/60'
          : 'border-lp-line-strong hover:border-lp-graphite'
      }`}
    >
      <span className="text-lg leading-none">📄</span>
      <span className="text-xs truncate underline">{attachment.name}</span>
    </a>
  )
}
