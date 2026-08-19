import horizonIcon from '../assets/horizon-icon.png'

// TODO: replace with your real support inbox before launch
const SUPPORT_EMAIL = 'support@REPLACE_WITH_YOUR_DOMAIN'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        fontFamily: 'var(--font-vivid)',
        background:
          'linear-gradient(135deg, #0A0A0B 0%, #1D1D20 38%, #0A0A0B 68%, #131315 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[13px] uppercase tracking-[0.02em] text-bone-white mb-3">
            <img src={horizonIcon} alt="" className="h-[22px] w-[22px] object-contain" />
            MyClaimAge
          </div>
          <p className="text-xs text-grey-text leading-relaxed max-w-2xl">
            MyClaimAge provides informational estimates only and is not a substitute for financial,
            legal, or tax advice. Not affiliated with or endorsed by the Social Security
            Administration.
          </p>
        </div>

        <div className="border-t border-ash-border pt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-xs">
          <span className="text-fog-blue">© {year} MyClaimAge. All rights reserved.</span>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-fog-blue">
            <a href="/privacy" className="hover:text-bone-white transition-colors">
              Privacy Policy
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-bone-white transition-colors">
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
