import { useEffect } from 'react'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | MyClaimAge'
  }, [])

  return (
    <main
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-3xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-fog-blue" />
          Privacy Policy
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white">
          What we collect, and why.
        </h1>
        <p className="mt-4 text-fog-blue text-lg leading-relaxed">
          Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}.
        </p>
      </div>

      <div className="bg-graphite-veil/15 border border-ash-border rounded-[15px] p-8 mb-8">
        <p className="text-sm text-bone-white leading-relaxed">
          <span className="font-normal">This is a working draft, not a finished legal document.</span>{' '}
          It accurately describes what the app's code actually does as of today, but it hasn't
          been reviewed by a lawyer. Have this checked by one before you rely on it publicly —
          especially the sections on AI processing and data retention.
        </p>
      </div>

      <div className="space-y-10 text-sm text-bone-white/85 leading-relaxed">
        <section>
          <h2 className="text-xl font-normal text-bone-white mb-3">What we collect</h2>
          <ul className="space-y-2 list-disc list-inside text-bone-white/75">
            <li>Your email address and password, handled entirely by Firebase Authentication.</li>
            <li>
              The Social Security details you enter — birth year, PIA, marital status, and
              similar figures used to run the calculations.
            </li>
            <li>
              Any document you upload to the document reader (SSA, IRS, or Medicare letters) —
              sent to Google's Gemini API to generate a plain-English summary, not stored by
              MyClaimAge after processing.
            </li>
            <li>
              Billing information is handled directly by Stripe — MyClaimAge never sees or stores
              your card details.
            </li>
            <li>
              If you're on the Advisor plan, the client records you add (name, birth year, PIA,
              and similar) to build claiming-strategy comparisons.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-normal text-bone-white mb-3">How it's used</h2>
          <p>
            Your saved numbers power the calculator, scenario modeling, and AI assistant — the
            assistant only answers using the figures already saved to your account, and the
            underlying benefit math itself is never performed by AI; it's a fixed calculation
            engine checked against published SSA formulas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-normal text-bone-white mb-3">AI processing (Gemini)</h2>
          <p>
            The AI assistant and document reader are powered by Google's Gemini API. Depending on
            which tier this account is running on, Google's free-tier terms may permit using
            submitted content (including uploaded documents) to improve their models. If this
            matters to you, ask — we can tell you which tier is currently active.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-normal text-bone-white mb-3">What we don't do</h2>
          <ul className="space-y-2 list-disc list-inside text-bone-white/75">
            <li>We don't sell your data to anyone.</li>
            <li>We don't share your Social Security numbers with advertisers.</li>
            <li>We don't run ads or ad-tracking in this app.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-normal text-bone-white mb-3">Your choices</h2>
          <p>
            You can delete your saved numbers, uploaded documents, and account at any time by
            contacting us. If you're on the Advisor plan, deleting a client record removes it
            immediately and permanently.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-normal text-bone-white mb-3">Contact</h2>
          <p>
            Questions about this policy or your data — reach us at{' '}
            <a href="mailto:support@REPLACE_WITH_YOUR_DOMAIN" className="text-bone-white underline hover:text-fog-blue transition-colors">
              support@REPLACE_WITH_YOUR_DOMAIN
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
