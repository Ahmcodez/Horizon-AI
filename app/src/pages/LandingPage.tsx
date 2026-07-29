import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useReveal } from '../lib/useReveal'

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Social Security Calculator — Know the Best Age to Claim | Horizon'
    const meta = document.querySelector('meta[name="description"]') ?? document.createElement('meta')
    meta.setAttribute('name', 'description')
    meta.setAttribute(
      'content',
      'Free Social Security calculator showing exactly when to claim — compare your benefit at every claiming age from 62 to 70, personalized to your record and updated for 2026 rules.'
    )
    if (!meta.parentElement) document.head.appendChild(meta)
  }, [])

  function primaryCta() {
    navigate(user ? '/app' : '/login')
  }

  return (
    <main className="bg-paper-dim" style={{ fontFamily: 'var(--font-luxe)' }}>
      <Hero onCtaClick={primaryCta} />
      <StatBar />
      <ProblemSection />
      <ProductSection />
      <FeaturesSection />
      <FaqSection />
      <FinalCta onCtaClick={primaryCta} />
      <Footer />
    </main>
  )
}

/* ---------------- Hero ---------------- */
function Hero({ onCtaClick }: { onCtaClick: () => void }) {
  const [screen, setScreen] = useState(0)
  const screens = ['comparison', 'chat', 'alerts'] as const

  useEffect(() => {
    const id = setInterval(() => setScreen((s) => (s + 1) % screens.length), 4200)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="relative overflow-hidden bg-obsidian text-paper pb-24"
    >
      {/* "Shiny black" treatment: two blacks blended on a diagonal, plus a
          slow-moving gold sheen and a soft glow blob for depth. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, var(--color-obsidian) 0%, var(--color-obsidian-elevated) 55%, var(--color-obsidian) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.6) 45%, transparent 60%)',
          backgroundSize: '250% 100%',
          animation: 'shimmer 9s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,183,0,0.16), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)' }}
      />

      <div className="relative max-w-[1280px] mx-auto px-8 pt-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="flex gap-2 flex-wrap mb-8">
              {['2026 COLA applied', 'Not affiliated with the SSA', 'Informational only'].map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-obsidian-line text-paper/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {t}
                </span>
              ))}
            </div>

            <h1 className="font-semibold text-[clamp(38px,4.6vw,68px)] leading-[1.03] tracking-tight">
              {['Know', 'the', 'best'].map((word, i) => (
                <span
                  key={word}
                  className="inline-block mr-3 opacity-0"
                  style={{ animation: `wordIn 0.9s cubic-bezier(.16,.8,.24,1) ${0.05 + i * 0.07}s forwards` }}
                >
                  {word}
                </span>
              ))}
              <br />
              <span
                className="inline-block text-gold italic font-medium opacity-0"
                style={{ animation: 'wordIn 0.9s cubic-bezier(.16,.8,.24,1) 0.3s forwards' }}
              >
                age to claim Social Security.
              </span>
            </h1>

            <p className="mt-6 text-lg text-paper/60 max-w-lg leading-relaxed">
              Our free Social Security calculator shows exactly what your benefit is worth at every
              claiming age from 62 to 70 — personalized to your record, not an average. One
              decision, made once, that can move your lifetime income by six figures.
            </p>

            <div className="mt-9 flex flex-wrap gap-3.5">
              <button
                onClick={onCtaClick}
                className="flex-1 min-w-[220px] text-left bg-paper rounded-2xl px-6 py-5 shadow-glow-white hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(255,255,255,0.22)] transition-all"
              >
                <div className="font-mono text-[11px] uppercase tracking-wide text-muted font-semibold mb-2">For myself</div>
                <div className="text-lg font-semibold text-ink mb-1">Plan my own claim</div>
                <div className="text-xs text-muted">Get your personalized breakdown in 5 minutes.</div>
                <div className="mt-3.5 text-sm font-semibold text-ink">Start free →</div>
              </button>
              <button
                onClick={onCtaClick}
                className="flex-1 min-w-[220px] text-left border border-obsidian-line rounded-2xl px-6 py-5 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all"
              >
                <div className="font-mono text-[11px] uppercase tracking-wide text-azure font-semibold mb-2">For my clients</div>
                <div className="text-lg font-semibold text-paper mb-1">I'm a financial advisor</div>
                <div className="text-xs text-paper/50">Manage claiming strategy across your book.</div>
                <div className="mt-3.5 text-sm font-semibold text-paper">See advisor tools →</div>
              </button>
            </div>
          </div>

          <div className="rounded-[20px] bg-obsidian-elevated border border-obsidian-line shadow-card-dark overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-black/30 border-b border-obsidian-line">
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <span className="ml-3 font-mono text-[11px] text-paper/40 bg-white/5 px-3 py-1 rounded-md flex-1">
                app.horizon.com/plan
              </span>
            </div>
            <div className="relative h-[400px] p-8">
              {screens[screen] === 'comparison' && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wide text-gold mb-5">Claiming comparison</div>
                  <div className="flex items-end gap-4 h-[190px] mt-6">
                    {[
                      { age: 62, val: 1890, h: 52 },
                      { age: 64, val: 2340, h: 68 },
                      { age: 67, val: 2690, h: 82, peak: true },
                      { age: 68, val: 2910, h: 90 },
                      { age: 70, val: 3320, h: 100 },
                    ].map((b) => (
                      <div key={b.age} className="flex-1 relative" style={{ height: `${b.h}%` }}>
                        <div
                          className={`w-full h-full rounded-t-md ${b.peak ? 'bg-gradient-to-b from-gold to-yellow-600' : 'bg-white/15'}`}
                        />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-xs text-paper whitespace-nowrap">
                          ${b.val.toLocaleString()}
                        </span>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] text-paper/40">
                          {b.age}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {screens[screen] === 'chat' && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wide text-azure mb-5">Ask Horizon</div>
                  <div className="bg-paper text-ink ml-auto max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium mb-2.5">
                    Should I claim now or wait 2 years?
                  </div>
                  <div className="bg-azure/15 border border-azure/20 text-paper max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed mb-2.5">
                    Waiting to 67 adds $612/mo for life. You'd break even by age 78 — after that,
                    waiting wins.
                  </div>
                  <div className="bg-paper text-ink ml-auto max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium">
                    What if I keep working part-time?
                  </div>
                </div>
              )}
              {screens[screen] === 'alerts' && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wide text-emerald mb-5">Rule-change alerts</div>
                  <div className="flex gap-3 bg-emerald/10 border border-emerald/20 rounded-xl px-4 py-3.5 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-paper leading-relaxed">
                      Medicare Part B rose to $202.90/mo — your net deposit is now $2,041.
                    </p>
                  </div>
                  <div className="flex gap-3 bg-emerald/10 border border-emerald/20 rounded-xl px-4 py-3.5">
                    <span className="w-2 h-2 rounded-full bg-emerald mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-paper leading-relaxed">
                      The Fairness Act repeal added an estimated $340/mo to your benefit.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-2 pb-5">
              {screens.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setScreen(i)}
                  aria-label={`Show ${s} screen`}
                  className={`h-1.5 rounded-full transition-all ${i === screen ? 'w-5 bg-gold' : 'w-1.5 bg-white/15'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Stat bar ---------------- */
function StatBar() {
  const ref = useReveal<HTMLDivElement>()
  const stats = [
    { num: '+31%', label: 'benefit increase, claiming at 70 vs. 62' },
    { num: '$214k', label: 'average lifetime difference between strategies' },
    { num: '2032', label: 'projected trust fund depletion year' },
    { num: '40', label: 'work credits needed to qualify' },
  ]
  return (
    <div ref={ref} className="reveal max-w-[1280px] mx-auto px-8 pt-14 grid grid-cols-2 md:grid-cols-4 border-b border-ink/8">
      {stats.map((s, i) => (
        <div key={s.label} className={`py-7 pr-6 ${i < stats.length - 1 ? 'md:border-r border-ink/8' : ''}`}>
          <div className="font-mono text-[clamp(22px,2.6vw,32px)] font-semibold text-ink">{s.num}</div>
          <div className="text-xs text-muted mt-1.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Problem section ---------------- */
function ProblemSection() {
  const ref = useReveal<HTMLDivElement>()
  const cards = [
    { n: '01', title: 'The decision is permanent', body: "Claim early and the reduction follows you for life. Most people file at 62 without ever seeing what waiting would have paid." },
    { n: '02', title: 'The rules keep moving', body: 'COLA, tax law, and provisions like the Social Security Fairness Act change your real numbers every year — nothing tells you when your plan is out of date.' },
    { n: '03', title: "The letters aren't written for you", body: 'SSA and Medicare notices arrive dense and unclear, right when the decision they affect can\'t be undone.' },
  ]
  return (
    <section id="how" className="max-w-[1280px] mx-auto px-8 py-28">
      <div className="font-mono text-xs uppercase tracking-wider text-ink/50 font-semibold mb-5 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-gold" />The problem
      </div>
      <h2 className="text-[clamp(28px,3.6vw,46px)] font-semibold leading-tight max-w-3xl text-ink">
        Every free Social Security calculator gives you a number. Nothing gives you a plan that keeps up.
      </h2>
      <div ref={ref} className="reveal grid md:grid-cols-3 gap-4 mt-12">
        {cards.map((c) => (
          <div
            key={c.n}
            className="bg-obsidian-elevated text-paper rounded-[20px] p-9 shadow-card-dark hover:-translate-y-1 transition-transform"
          >
            <div className="font-mono text-xs text-gold mb-4">{c.n}</div>
            <h3 className="text-[21px] font-semibold mb-2.5">{c.title}</h3>
            <p className="text-sm text-paper/60 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Product (dark) section ---------------- */
function ProductSection() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className="reveal mx-8">
      <div className="max-w-[1280px] mx-auto bg-obsidian-elevated text-paper rounded-[32px] px-10 md:px-14 py-16 relative overflow-hidden shadow-card-dark border border-obsidian-line">
        <div className="font-mono text-xs uppercase tracking-wider text-gold font-semibold mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-gold" />Your actual numbers
        </div>
        <h2 className="text-[clamp(28px,3.6vw,46px)] font-semibold leading-tight max-w-2xl">
          Not an estimate. Your record, run against every claiming age.
        </h2>
        <p className="mt-4 text-paper/60 max-w-lg leading-relaxed">
          Enter your earnings history — or photograph your SSA statement — and Horizon models
          exactly what changes at 62, at full retirement age, and at 70.
        </p>
        <div className="flex gap-10 mt-10 flex-wrap">
          <div>
            <div className="font-mono text-2xl font-semibold text-gold">+$612</div>
            <div className="text-xs text-paper/50 mt-1">monthly gain, 62 → 67</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-gold">+$1,430</div>
            <div className="text-xs text-paper/50 mt-1">monthly gain, 62 → 70</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-gold">10.5 yrs</div>
            <div className="text-xs text-paper/50 mt-1">breakeven vs. claiming early</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Features (bento) ---------------- */
function FeaturesSection() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section id="features" className="max-w-[1280px] mx-auto px-8 py-28">
      <div className="font-mono text-xs uppercase tracking-wider text-ink/50 font-semibold mb-5 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-gold" />What's inside
      </div>
      <h2 className="text-[clamp(28px,3.6vw,46px)] font-semibold leading-tight max-w-3xl mb-12 text-ink">
        A plan that talks back, reads your mail, and tells you when something changes.
      </h2>
      <div ref={ref} className="reveal grid grid-cols-2 md:grid-cols-4 auto-rows-[130px] gap-4">
        <div className="col-span-2 row-span-2 rounded-[22px] bg-obsidian-elevated text-paper p-7 shadow-card-dark hover:-translate-y-1 transition-transform">
          <div className="font-mono text-[11px] uppercase tracking-wide text-azure mb-3.5">AI assistant · Ask, in plain english</div>
          <h3 className="text-xl font-semibold mb-2.5">"Should I claim now, or wait two years?"</h3>
          <p className="text-sm text-paper/60">Horizon's assistant answers using your actual saved numbers.</p>
        </div>
        <div className="rounded-[22px] bg-emerald text-obsidian p-7 shadow-glow-emerald hover:-translate-y-1 transition-transform">
          <div className="font-mono text-[11px] uppercase tracking-wide opacity-70 mb-3.5">Coordination</div>
          <h3 className="text-xl font-semibold mb-2.5">Spousal &amp; survivor</h3>
          <p className="text-sm opacity-80">Maximize household lifetime benefit.</p>
        </div>
        <div className="rounded-[22px] bg-paper border border-ink/8 shadow-card-light p-7 hover:-translate-y-1 transition-transform">
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted mb-3.5">Mail, decoded</div>
          <h3 className="text-xl font-semibold mb-2.5 text-ink">Upload the letter</h3>
          <p className="text-sm text-muted">Get a plain-English answer instantly.</p>
        </div>
        <div className="col-span-2 rounded-[22px] bg-paper border border-ink/8 shadow-card-light p-7 hover:-translate-y-1 transition-transform">
          <div className="font-mono text-[11px] uppercase tracking-wide text-gold mb-3.5">Stay current · Alerts</div>
          <h3 className="text-xl font-semibold mb-2.5 text-ink">Rule-change alerts, personalized</h3>
          <p className="text-sm text-muted">"The Fairness Act repeal added an estimated $340/mo to your benefit."</p>
        </div>
        <div className="col-span-2 row-span-2 rounded-[22px] bg-obsidian-elevated text-paper p-7 shadow-card-dark hover:-translate-y-1 transition-transform">
          <div className="font-mono text-[11px] uppercase tracking-wide text-gold mb-3.5">Scenario modeling</div>
          <h3 className="text-xl font-semibold mb-2.5">"What if benefits get cut?"</h3>
          <p className="text-sm text-paper/60">Model a possible trust-fund-depletion cut against your real numbers.</p>
        </div>
        <div className="col-span-2 rounded-[22px] bg-paper border border-ink/8 shadow-card-light p-7 hover:-translate-y-1 transition-transform">
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted mb-3.5">WEP / GPO aware</div>
          <h3 className="text-xl font-semibold mb-2.5 text-ink">Public-service pensions, handled correctly</h3>
          <p className="text-sm text-muted">Reflects the 2025 Fairness Act repeal automatically.</p>
        </div>
      </div>
    </section>
  )
}

/* ---------------- FAQ ---------------- */
function FaqSection() {
  const [open, setOpen] = useState(0)
  const faqs = [
    { q: 'What is the best age to claim Social Security?', a: 'There is no single best age for everyone — it depends on your health, other income, and household situation. Claiming at 62 reduces your monthly benefit permanently, while waiting until 70 increases it.' },
    { q: 'How much does Social Security increase if I wait to claim?', a: 'Delaying benefits past full retirement age adds delayed retirement credits worth roughly 8% per year, up until age 70. Claiming before full retirement age instead reduces your benefit, by as much as 30% at age 62.' },
    { q: 'What is full retirement age (FRA) in 2026?', a: 'For anyone born in 1960 or later, full retirement age is 67 — the final step of a phase-in that began with 1983 legislation.' },
    { q: 'Does working while claiming Social Security reduce my benefit?', a: 'If you claim before full retirement age and continue working, Social Security withholds a portion of your benefit above an annual earnings limit. That no longer applies once you reach full retirement age.' },
  ]
  return (
    <section id="faq" className="max-w-[1280px] mx-auto px-8 py-28">
      <div className="font-mono text-xs uppercase tracking-wider text-ink/50 font-semibold mb-5 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-gold" />Common questions
      </div>
      <h2 className="text-[clamp(28px,3.6vw,46px)] font-semibold leading-tight max-w-3xl mb-10 text-ink">
        Social Security claiming — answered plainly.
      </h2>
      <div className="max-w-2xl">
        {faqs.map((f, i) => (
          <div key={f.q} className="border-b border-ink/8">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full text-left py-5 flex items-center justify-between gap-5 font-semibold text-ink"
            >
              {f.q}
              <span className={`font-mono text-lg text-gold transition-transform flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open === i && <p className="text-sm text-muted leading-relaxed pb-5 max-w-xl">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Final CTA ---------------- */
function FinalCta({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="text-center px-8 py-32 bg-obsidian text-paper">
      <h2 className="text-[clamp(30px,4.6vw,56px)] font-semibold leading-tight max-w-2xl mx-auto mb-8">
        Your number is waiting. <span className="text-gold italic">It takes five minutes to see it.</span>
      </h2>
      <button
        onClick={onCtaClick}
        className="bg-paper text-ink font-bold px-8 py-4 rounded-full shadow-glow-white hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(255,255,255,0.22)] transition-all"
      >
        Calculate my benefit — free
      </button>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-obsidian text-paper/50 border-t border-obsidian-line px-8 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm">
      <div>© 2026 Horizon Financial Technologies</div>
      <p className="max-w-xl text-xs leading-relaxed">
        Horizon provides informational estimates only and is not a substitute for financial,
        legal, or tax advice. Not affiliated with or endorsed by the Social Security
        Administration.
      </p>
    </footer>
  )
}
