// TODO: replace with your real support inbox before launch
const SUPPORT_EMAIL = 'support@REPLACE_WITH_YOUR_DOMAIN'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="bg-vivid-obsidian border-t border-ash-border"
    >
      <div className="max-w-6xl mx-auto px-8 py-12">
        <p className="text-xs text-grey-text leading-relaxed max-w-2xl mb-8">
          Horizon provides informational estimates only and is not a substitute for financial,
          legal, or tax advice. Not affiliated with or endorsed by the Social Security
          Administration.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-ash-border">
          <div className="text-[13px] uppercase tracking-[0.02em] text-bone-white">Horizon</div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-fog-blue">
            <a href="/privacy" className="hover:text-bone-white transition-colors">
              Privacy Policy
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-bone-white transition-colors">
              {SUPPORT_EMAIL}
            </a>
            <span>© {year} Horizon</span>
          </nav>
        </div>
      </div>
    </footer>
  )
}
