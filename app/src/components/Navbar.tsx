import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { useAlerts } from '../lib/alerts'
import { usePlan } from '../lib/billing'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()
  const alerts = useAlerts(user?.uid)
  const { plan } = usePlan(user?.uid)
  const unreadCount = alerts.filter((a) => !a.read).length

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Primary"
        style={{ fontFamily: 'var(--font-luxe)' }}
        className={`w-full max-w-5xl flex items-center justify-between gap-4 px-3 py-2.5 rounded-full border border-obsidian-line bg-obsidian/90 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? 'shadow-card-dark' : 'shadow-[0_8px_24px_rgba(0,0,0,0.25)]'
        }`}
      >
        <a href="/" className="flex items-center gap-2 pl-2 text-[15px] font-semibold tracking-tight text-paper">
          <span className="w-[16px] h-[16px] rounded-full bg-gold flex-shrink-0" />
          Horizon
        </a>

        {user ? (
          <>
            <ul className="hidden md:flex items-center gap-0.5 text-[13.5px] font-medium">
              <li><NavLink href="/calculator">Calculator</NavLink></li>
              <li><NavLink href="/documents">Documents</NavLink></li>
              <li><NavLink href="/scenarios">Scenarios</NavLink></li>
              <li><NavLink href="/states">States</NavLink></li>
              <li><NavLink href="/billing">Billing</NavLink></li>
              {plan === 'advisor' && <li><NavLink href="/advisor">Advisor</NavLink></li>}
              {plan === 'advisor' && <li><NavLink href="/embed">Embed</NavLink></li>}
            </ul>
            <div className="flex items-center gap-2">
              <a
                href="/alerts"
                className="relative w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-paper"
                aria-label={`Alerts${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold text-obsidian text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
              <a
                href="/app"
                className="bg-paper text-ink px-4 py-2 rounded-full text-[13.5px] font-semibold shadow-glow-white hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,255,255,0.25)] transition-all"
              >
                Go to my plan
              </a>
            </div>
          </>
        ) : (
          <>
            <ul className="hidden md:flex items-center gap-0.5 text-[13.5px] font-medium">
              <li><NavLink href="/#how">How it works</NavLink></li>
              <li><NavLink href="/#features">Features</NavLink></li>
              <li><NavLink href="/#faq">FAQ</NavLink></li>
            </ul>
            <div className="flex items-center gap-1">
              <a href="/login" className="text-[13.5px] font-medium text-paper/70 hover:text-paper transition-colors px-3.5 py-2">
                Sign in
              </a>
              <a
                href="/login"
                className="bg-paper text-ink px-4 py-2 rounded-full text-[13.5px] font-semibold shadow-glow-white hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,255,255,0.25)] transition-all"
              >
                Get started
              </a>
            </div>
          </>
        )}
      </nav>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3.5 py-2 rounded-full text-paper/65 hover:text-paper hover:bg-white/5 transition-colors inline-block"
    >
      {children}
    </a>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
