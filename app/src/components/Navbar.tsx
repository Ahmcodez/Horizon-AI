import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useAlerts } from '../lib/alerts'
import { usePlan } from '../lib/billing'
import horizonIcon from '../assets/horizon-icon.png'
import '../homepage.css'

/**
 * Per the original Vivid+Co brief, this nav used to be bone-white text only,
 * no filled buttons or accent colors. That's been deliberately overridden
 * to match the new landing-site direction: the "My plan" / "Get started"
 * CTAs use the .lp-gradient-btn treatment, and the unread-alert badge and
 * a few other small touches use the new cyan accent (--color-lp-cyan).
 * Nav links themselves remain plain bone-white, unchanged.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()
  // The public marketing nav shows on the homepage for everyone, and on any
  // page for logged-out visitors. The app nav is only for logged-in users
  // once they're inside the app.
  const showAppNav = !!user && pathname !== '/'
  const alerts = useAlerts(user?.uid)
  const { plan, status } = usePlan(user?.uid)
  const unreadCount = alerts.filter((a) => !a.read).length
  const devUnlocked = status === 'dev-unlocked'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!showAppNav) return <MarketingNav scrolled={scrolled} loggedIn={!!user} />

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Primary"
        style={{ fontFamily: 'var(--font-jakarta)' }}
        className={`w-full max-w-5xl flex items-center justify-between gap-4 px-5 py-3 rounded-[5px] border-b transition-colors duration-500 ${
          scrolled ? 'bg-vivid-obsidian/95 border-ash-border' : 'bg-vivid-obsidian/80 border-ash-border/50'
        }`}
      >
        <a href="/" className="flex items-center gap-2 text-[15px] font-normal tracking-tight text-bone-white uppercase">
          <img src={horizonIcon} alt="" className="h-[30px] w-[30px] object-contain" />
          MyClaimAge
          {devUnlocked && (
            <span className="text-[10px] normal-case tracking-normal font-mono border border-bone-white/40 text-fog-blue px-1.5 py-0.5 rounded-[3px]">
              dev-unlocked
            </span>
          )}
        </a>

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
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[var(--color-lp-cyan)] text-vivid-obsidian text-[9px] font-medium flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </a>
            <a href="/app" className="lp-gradient-btn">
              My plan
            </a>
          </div>
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

/**
 * The public marketing nav, restored to the original landing-page design
 * (styles live in homepage.css under .hp). Anchor links use "/#id" so they
 * work from any route, not just the homepage.
 */
function MarketingNav({ scrolled, loggedIn }: { scrolled: boolean; loggedIn: boolean }) {
  return (
    <div className="hp">
      <header className="site-header">
        <nav className={`primary-nav${scrolled ? ' scrolled' : ''}`} aria-label="Primary">
          <a href="/#top" className="logo">
            <span className="logo-mark" aria-hidden="true" />
            MyClaimAge
          </a>
          <ul className="nav-links">
            <li className="nav-item"><a className="nav-link" href="/#how">How it works</a></li>
            <li className="nav-item">
              <a className="nav-link" href="/#features">Features <span className="caret">▾</span></a>
              <div className="nav-dropdown">
                <a className="dd-item" href="/#features"><div className="dd-icon">AI</div><div><h3>AI assistant</h3><p>Ask questions about your plan in plain English</p></div></a>
                <a className="dd-item" href="/#features"><div className="dd-icon">Σ</div><div><h3>Claiming calculator</h3><p>Compare every age from 62 to 70</p></div></a>
                <a className="dd-item" href="/#features"><div className="dd-icon">✉</div><div><h3>Document reader</h3><p>Upload SSA &amp; Medicare letters, get plain-English answers</p></div></a>
                <a className="dd-item" href="/#alerts"><div className="dd-icon">◔</div><div><h3>Rule-change alerts</h3><p>Know the moment something affects your plan</p></div></a>
              </div>
            </li>
            <li className="nav-item"><a className="nav-link" href="/#guides">Guides</a></li>
            <li className="nav-item"><a className="nav-link" href="/#pricing">Pricing</a></li>
            <li className="nav-item"><a className="nav-link" href="/#faq">FAQ</a></li>
            <li className="nav-item"><a className="nav-link" href="/#advisors">For advisors</a></li>
          </ul>
          {loggedIn ? (
            <a href="/app" className="nav-cta">My plan</a>
          ) : (
            <a href="/login?mode=signup" className="nav-cta">Get your number</a>
          )}
        </nav>
      </header>
    </div>
  )
}
