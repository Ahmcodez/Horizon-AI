import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useReveal } from '../lib/useReveal'

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Horizon — Social Security Calculator & Claiming Age Planner'
    const meta = document.querySelector('meta[name="description"]') ?? document.createElement('meta')
    meta.setAttribute('name', 'description')
    meta.setAttribute(
      'content',
      'See exactly what your Social Security benefit is worth at every claiming age from 62 to 70 — personalized to your record, updated for 2026 rules, free to start.'
    )
    if (!meta.parentElement) document.head.appendChild(meta)
  }, [])

  function primaryCta() {
    navigate(user ? '/app' : '/login')
  }

  return (
    <main className="pt-40">
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
    <section className="max-w-[1280px] mx-auto px-8">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <div className="flex gap-2 flex-wrap mb-8">
            {['2026 COLA applied', 'Not affiliated with the SSA', 'Informational only'].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-full bg-chalk-dim border border-graphite/10 text-slate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                {t}
              </span>
            ))}
          </div>

          <h1 className="font-display font-normal text-[clamp(38px,4.6vw,68px)] leading-[1.02] tracking-tight">
            {['Your', 'Social', 'Security,'].map((word, i) => (
              <span
                key={word}
                className="inline-block mr-3 opacity-0"
                style={{ animation: `wordIn 0.9s cubic-bezier(.16,.8,.24,1) ${0.05 + i * 0.07}s forwards` }}
              >
                {word}
              </span>
            ))}
            <span
              className="inline-block text-amber-deep italic font-medium opacity-0"
              style={{ animation: 'wordIn 0.9s cubic-bezier(.16,.8,.24,1) 0.3s forwards' }}
            >
              calculated exactly.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate max-w-lg leading-relaxed">
            One decision, made once, that can move your lifetime income by six figures. Horizon
            shows you the real numbers — yours, not an average — at every claiming age from 62 to
            70.
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <button
              onClick={onCtaClick}
              className="flex-1 min-w-[220px] text-left bg-graphite border border-graphite rounded-2xl px-6 py-5 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="font-mono text-[11px] uppercase tracking-wide text-amber font-semibold mb-2">For myself</div>
              <div className="font-display text-lg font-medium text-chalk mb-1">Plan my own claim</div>
              <div className="text-xs text-chalk/60">Get your personalized breakdown in 5 minutes.</div>
              <div className="mt-3.5 text-sm font-semibold text-amber">Start free →</div>
            </button>
            <button
              onClick={onCtaClick}
              className="flex-1 min-w-[220px] text-left border border-graphite/15 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md hover:border-amber-deep transition-all bg-chalk"
            >
              <div className="font-mono text-[11px] uppercase tracking-wide text-amber-deep font-semibold mb-2">For my clients</div>
              <div className="font-display text-lg font-medium mb-1">I'm a financial advisor</div>
              <div className="text-xs text-slate">Manage claiming strategy across your book.</div>
              <div className="mt-3.5 text-sm font-semibold text-graphite">See advisor tools →</div>
            </button>
          </div>
        </div>

        <div className="rounded-[20px] bg-graphite-2 border border-white/10 shadow-lg overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 bg-graphite-3 border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8846B]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8C86B]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#7BC29A]" />
            <span className="ml-3 font-mono text-[11px] text-chalk/50 bg-white/5 px-3 py-1 rounded-md flex-1">
              app.horizon.com/plan
            </span>
          </div>
          <div className="relative h-[400px] p-8">
            {screens[screen] === 'comparison' && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wide text-amber mb-5">Claiming comparison</div>
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
                        className={`w-full h-full rounded-t-md ${b.peak ? 'bg-gradient-to-b from-amber to-amber-deep' : 'bg-white/15'}`}
                      />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-xs text-chalk whitespace-nowrap">
                        ${b.val.toLocaleString()}
                      </span>
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] text-chalk/40">
                        {b.age}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {screens[screen] === 'chat' && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wide text-amber mb-5">Ask Horizon</div>
                <div className="bg-amber text-graphite ml-auto max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium mb-2.5">
                  Should I claim now or wait 2 years?
                </div>
                <div className="bg-white/5 text-chalk max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed mb-2.5">
                  Waiting to 67 adds $612/mo for life. You'd break even by age 78 — after that,
                  waiting wins.
                </div>
                <div className="bg-amber text-graphite ml-auto max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium">
                  What if I keep working part-time?
                </div>
              </div>
            )}
            {screens[screen] === 'alerts' && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wide text-amber mb-5">Rule-change alerts</div>
                <div className="flex gap-3 bg-white/5 rounded-xl px-4 py-3.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-chalk leading-relaxed">
                    Medicare Part B rose to $202.90/mo — your net deposit is now $2,041.
                  </p>
                </div>
                <div className="flex gap-3 bg-white/5 rounded-xl px-4 py-3.5">
                  <span className="w-2 h-2 rounded-full bg-amber mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-chalk leading-relaxed">
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
                className={`h-1.5 rounded-full transition-all ${i === screen ? 'w-5 bg-amber' : 'w-1.5 bg-white/15'}`}
              />
            ))}
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
    <div ref={ref} className="reveal max-w-[1280px] mx-auto px-8 mt-20 grid grid-cols-2 md:grid-cols-4 border-y border-graphite/10">
      {stats.map((s, i) => (
        <div key={s.label} className={`py-7 pr-6 ${i < stats.length - 1 ? 'md:border-r border-graphite/10' : ''}`}>
          <div className="font-mono text-[clamp(22px,2.6vw,32px)] font-semibold text-amber-deep">{s.num}</div>
          <div className="text-xs text-slate mt-1.5">{s.label}</div>
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
      <div className="font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-5 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-amber-deep" />The problem
      </div>
      <h2 className="font-display text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-3xl">
        Every free Social Security calculator gives you a number. Nothing gives you a plan that keeps up.
      </h2>
      <div ref={ref} className="reveal grid md:grid-cols-3 gap-px bg-graphite/15 border border-graphite/15 rounded-[20px] overflow-hidden mt-12">
        {cards.map((c) => (
          <div key={c.n} className="bg-chalk p-9 hover:bg-chalk-dim transition-colors">
            <div className="font-mono text-xs text-amber-deep mb-4">{c.n}</div>
            <h3 className="font-display text-[21px] font-medium mb-2.5">{c.title}</h3>
            <p className="text-sm text-slate leading-relaxed">{c.body}</p>
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
      <div className="max-w-[1280px] mx-auto bg-graphite text-chalk rounded-[32px] px-10 md:px-14 py-16 relative overflow-hidden">
        <div className="font-mono text-xs uppercase tracking-wider text-amber font-semibold mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-amber" />Your actual numbers
        </div>
        <h2 className="font-display text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-2xl">
          Not an estimate. Your record, run against every claiming age.
        </h2>
        <p className="mt-4 text-chalk/60 max-w-lg leading-relaxed">
          Enter your earnings history — or photograph your SSA statement — and Horizon models
          exactly what changes at 62, at full retirement age, and at 70.
        </p>
        <div className="flex gap-10 mt-10 flex-wrap">
          <div>
            <div className="font-mono text-2xl font-semibold text-amber">+$612</div>
            <div className="text-xs text-chalk/50 mt-1">monthly gain, 62 → 67</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-amber">+$1,430</div>
            <div className="text-xs text-chalk/50 mt-1">monthly gain, 62 → 70</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-amber">10.5 yrs</div>
            <div className="text-xs text-chalk/50 mt-1">breakeven vs. claiming early</div>
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
      <div className="font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-5 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-amber-deep" />What's inside
      </div>
      <h2 className="font-display text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-3xl mb-12">
        A plan that talks back, reads your mail, and tells you when something changes.
      </h2>
      <div ref={ref} className="reveal grid grid-cols-2 md:grid-cols-4 auto-rows-[130px] gap-4">
        <div className="col-span-2 row-span-2 rounded-[22px] bg-graphite text-chalk p-7">
          <div className="font-mono text-[11px] uppercase tracking-wide opacity-60 mb-3.5">Ask, in plain english</div>
          <h3 className="font-display text-xl font-medium mb-2.5">"Should I claim now, or wait two years?"</h3>
          <p className="text-sm opacity-75">Horizon's assistant answers using your actual saved numbers.</p>
        </div>
        <div className="rounded-[22px] bg-amber text-graphite p-7">
          <div className="font-mono text-[11px] uppercase tracking-wide opacity-70 mb-3.5">Coordination</div>
          <h3 className="font-display text-xl font-medium mb-2.5">Spousal &amp; survivor</h3>
          <p className="text-sm opacity-80">Maximize household lifetime benefit.</p>
        </div>
        <div className="rounded-[22px] bg-chalk-dim border border-graphite/10 p-7">
          <div className="font-mono text-[11px] uppercase tracking-wide text-slate mb-3.5">Mail, decoded</div>
          <h3 className="font-display text-xl font-medium mb-2.5">Upload the letter</h3>
          <p className="text-sm text-slate">Get a plain-English answer instantly.</p>
        </div>
        <div className="col-span-2 rounded-[22px] bg-chalk-dim border border-graphite/10 p-7">
          <div className="font-mono text-[11px] uppercase tracking-wide text-slate mb-3.5">Stay current</div>
          <h3 className="font-display text-xl font-medium mb-2.5">Rule-change alerts, personalized</h3>
          <p className="text-sm text-slate">"The Fairness Act repeal added an estimated $340/mo to your benefit."</p>
        </div>
        <div className="col-span-2 row-span-2 rounded-[22px] bg-graphite text-chalk p-7">
          <div className="font-mono text-[11px] uppercase tracking-wide opacity-60 mb-3.5">Scenario modeling</div>
          <h3 className="font-display text-xl font-medium mb-2.5">"What if benefits get cut?"</h3>
          <p className="text-sm opacity-75">Model a possible trust-fund-depletion cut against your real numbers.</p>
        </div>
        <div className="col-span-2 rounded-[22px] bg-chalk-dim border border-graphite/10 p-7">
          <div className="font-mono text-[11px] uppercase tracking-wide text-slate mb-3.5">WEP / GPO aware</div>
          <h3 className="font-display text-xl font-medium mb-2.5">Public-service pensions, handled correctly</h3>
          <p className="text-sm text-slate">Reflects the 2025 Fairness Act repeal automatically.</p>
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
      <div className="font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-5 flex items-center gap-2">
        <span className="w-4 h-[1.5px] bg-amber-deep" />Common questions
      </div>
      <h2 className="font-display text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-3xl mb-10">
        Social Security claiming — answered plainly.
      </h2>
      <div className="max-w-2xl">
        {faqs.map((f, i) => (
          <div key={f.q} className="border-b border-graphite/10">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full text-left py-5 flex items-center justify-between gap-5 font-semibold"
            >
              {f.q}
              <span className={`font-mono text-lg text-amber-deep transition-transform flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open === i && <p className="text-sm text-slate leading-relaxed pb-5 max-w-xl">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Final CTA ---------------- */
function FinalCta({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="text-center px-8 py-32">
      <h2 className="font-display text-[clamp(30px,4.6vw,56px)] font-normal leading-tight max-w-2xl mx-auto mb-8">
        Your number is waiting. <span className="text-amber-deep italic">It takes five minutes to see it.</span>
      </h2>
      <button
        onClick={onCtaClick}
        className="bg-amber text-graphite font-bold px-8 py-4 rounded-full shadow-sm hover:shadow-amber hover:-translate-y-0.5 transition-all"
      >
        Calculate my benefit — free
      </button>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-graphite/10 px-8 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm text-slate">
      <div>© 2026 Horizon Financial Technologies</div>
      <p className="max-w-xl text-xs leading-relaxed">
        Horizon provides informational estimates only and is not a substitute for financial,
        legal, or tax advice. Not affiliated with or endorsed by the Social Security
        Administration.
      </p>
    </footer>
  )
}
