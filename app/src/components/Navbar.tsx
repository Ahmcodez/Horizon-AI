import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { useAlerts } from '../lib/alerts'
import { usePlan } from '../lib/billing'
import horizonIcon from '../assets/horizon-icon.png'

/**
 * Per the Vivid+Co brief: no filled buttons, no shadows, no accent colors
 * outside the (unused-here) prism artifact. The nav uses only bone-white
 * text on a near-black surface, a 1px ash-border hairline instead of a
 * shadow for definition, and the brief's single outlined "Contact button"
 * pattern as the nav's one and only CTA style.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()
  const alerts = useAlerts(user?.uid)
  const { plan, status } = usePlan(user?.uid)
  const unreadCount = alerts.filter((a) => !a.read).length
  const devUnlocked = status === 'dev-unlocked'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Primary"
        style={{ fontFamily: 'var(--font-vivid)' }}
        className={`w-full max-w-5xl flex items-center justify-between gap-4 px-5 py-3 rounded-[5px] border-b transition-colors duration-500 ${
          scrolled ? 'bg-vivid-obsidian/95 border-ash-border' : 'bg-vivid-obsidian/80 border-ash-border/50'
        }`}
      >
        <a href="/" className="flex items-center gap-2 text-[15px] font-normal tracking-tight text-bone-white uppercase">
          <img src={horizonIcon} alt="" className="h-[30px] w-[30px] object-contain" />
          Horizon
          {devUnlocked && (
            <span className="text-[10px] normal-case tracking-normal font-mono border border-bone-white/40 text-fog-blue px-1.5 py-0.5 rounded-[3px]">
              dev-unlocked
            </span>
          )}
        </a>

        {user ? (
          <>
            <ul className="hidden md:flex items-center gap-6 text-[14px] font-normal uppercase">
              <li><GhostNavLink href="/calculator">Calculator</GhostNavLink></li>
              <li><GhostNavLink href="/documents">Documents</GhostNavLink></li>
              <li><GhostNavLink href="/scenarios">Scenarios</GhostNavLink></li>
              <li><GhostNavLink href="/states">States</GhostNavLink></li>
              <li><GhostNavLink href="/tax-medicare">Tax &amp; Medicare</GhostNavLink></li>
              <li><GhostNavLink href="/billing">Billing</GhostNavLink></li>
              {plan === 'advisor' && <li><GhostNavLink href="/advisor">Advisor</GhostNavLink></li>}
              {plan === 'advisor' && <li><GhostNavLink href="/embed">Embed</GhostNavLink></li>}
            </ul>
            <div className="flex items-center gap-4">
              <a
                href="/alerts"
                className="relative text-bone-white/70 hover:text-bone-white transition-colors duration-500"
                style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
                aria-label={`Alerts${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-bone-white text-vivid-obsidian text-[9px] font-medium flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
              <a href="/app" className="ov-outlined-btn">
                My plan
              </a>
            </div>
          </>
        ) : (
          <>
            <ul className="hidden md:flex items-center gap-6 text-[14px] font-normal uppercase">
              <li><GhostNavLink href="/#how">How it works</GhostNavLink></li>
              <li><GhostNavLink href="/#features">Features</GhostNavLink></li>
              <li><GhostNavLink href="/#faq">FAQ</GhostNavLink></li>
            </ul>
            <div className="flex items-center gap-5">
              <a
                href="/login"
                className="text-[14px] font-normal uppercase text-bone-white/70 hover:text-bone-white transition-colors duration-500"
                style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
              >
                Sign in
              </a>
              <a href="/login" className="ov-outlined-btn">
                Get started
              </a>
            </div>
          </>
        )}
      </nav>
    </header>
  )
}

function GhostNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-bone-white/70 hover:text-bone-white transition-colors duration-500"
      style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
    >
      {children}
    </a>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
