import { useNavigate } from 'react-router-dom'

/**
 * A small popup (not a full-page takeover) used wherever a free-tier user
 * tries to use something gated — right now, that's any AI feature (the
 * assistant chat and the "explain" shortcuts). UpgradeGate is for an entire
 * page/section; this is for a single blocked action.
 */
export default function UpgradeModal({
  open,
  onClose,
  title = 'This is a Plan feature',
  description = 'The AI assistant is part of the Plan tier — ask follow-up questions about your numbers, get plain-English explanations, and more.',
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}) {
  const navigate = useNavigate()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40"
      style={{ fontFamily: 'var(--font-jakarta)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-lp-chalk border border-lp-line-strong rounded-[15px] p-8 max-w-sm w-full text-center relative"
        style={{ animation: 'fadeUp 0.25s cubic-bezier(.16,.8,.24,1)' }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-lp-slate hover:text-lp-graphite transition-colors text-xl leading-none"
        >
          ×
        </button>
        <div className="text-xs uppercase tracking-[0.02em] text-lp-slate mb-3">Upgrade to unlock</div>
        <h3 className="text-xl font-normal mb-2 text-lp-graphite">{title}</h3>
        <p className="text-sm text-lp-slate leading-relaxed mb-6">{description}</p>
        <button
          onClick={() => navigate('/billing')}
          className="lp-gradient-btn w-full py-3"
        >
          See plans
        </button>
      </div>
    </div>
  )
}
