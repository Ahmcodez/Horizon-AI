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
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        aria-label="Primary"
        className={`flex items-center justify-between px-8 transition-all duration-300 backdrop-blur-md border-b border-graphite/10 ${
          scrolled ? 'py-3 shadow-md bg-chalk/95' : 'py-4 bg-chalk/80'
        }`}
      >
        <a href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <span className="w-[18px] h-[18px] bg-amber rounded-[5px_5px_5px_0] shadow-[0_2px_8px_rgba(232,163,61,0.5)]" />
          Horizon
        </a>

        {user ? (
          <>
            <ul className="hidden md:flex items-center gap-1 text-sm font-medium">
              <li><NavLink href="/calculator">Calculator</NavLink></li>
              <li><NavLink href="/documents">Documents</NavLink></li>
              <li><NavLink href="/scenarios">Scenarios</NavLink></li>
              <li><NavLink href="/states">States</NavLink></li>
              <li><NavLink href="/billing">Billing</NavLink></li>
              {plan === 'advisor' && <li><NavLink href="/advisor">Advisor</NavLink></li>}
              {plan === 'advisor' && <li><NavLink href="/embed">Embed</NavLink></li>}
            </ul>
            <div className="flex items-center gap-3">
              <a
                href="/alerts"
                className="relative w-9 h-9 rounded-full bg-chalk-dim hover:bg-graphite hover:text-chalk flex items-center justify-center transition-colors text-graphite"
                aria-label={`Alerts${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber text-graphite text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
              <a
                href="/app"
                className="bg-graphite text-chalk px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-amber hover:text-graphite hover:-translate-y-0.5 transition-all"
              >
                Go to my plan
              </a>
            </div>
          </>
        ) : (
          <>
            <ul className="hidden md:flex items-center gap-1 text-sm font-medium">
              <li><NavLink href="/#how">How it works</NavLink></li>
              <li><NavLink href="/#features">Features</NavLink></li>
              <li><NavLink href="/#faq">FAQ</NavLink></li>
            </ul>
            <div className="flex items-center gap-3">
              <a href="/login" className="text-sm font-medium text-slate hover:text-graphite transition-colors px-3">
                Sign in
              </a>
              <a
                href="/login"
                className="bg-graphite text-chalk px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-amber hover:text-graphite hover:-translate-y-0.5 transition-all"
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
    <a href={href} className="px-4 py-2 rounded-lg text-slate hover:text-graphite hover:bg-chalk-dim transition-colors inline-block">
      {children}
    </a>
  )
}
