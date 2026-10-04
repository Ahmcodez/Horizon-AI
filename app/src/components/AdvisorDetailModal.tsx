import { useEffect } from 'react'
import type { ReactNode } from 'react'

/**
 * Full-screen-ish overlay shown when a client clicks an advisor's gig tile
 * in the directory grid - the tile itself only has room for a condensed
 * preview, so this is where the complete profile (every specialty, full
 * bio, licensing, pricing note) and the message-request form actually live.
 */
export default function AdvisorDetailModal({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-[rgba(15,23,42,0.55)] px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="gig-card w-full max-w-xl rounded-[15px] bg-lp-chalk p-7 relative my-auto"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-lp-slate hover:text-lp-graphite hover:bg-[rgba(56,189,248,0.1)] transition-colors text-lg leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
