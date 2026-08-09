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
    <main className="bg-vivid-obsidian" style={{ fontFamily: 'var(--font-vivid)' }}>
      <Hero onCtaClick={primaryCta} />
      <StatBar />
      <ProblemSection />
      <ProductSection />
      <FeaturesSection />
      <FaqSection />
      <FinalCta onCtaClick={primaryCta} />
    </main>
  )
}

/* ---------------- Hero ---------------- */
/**
 * A simplified nod to the brief's signature "prism artifact" (glass cubes
 * with RGB-split chromatic edges). The brief describes a photorealistic
 * 3D render with caustics, which is out of scope to build well without a
 * real illustration/3D pipeline - this is a small, flat, tasteful
 * approximation instead: three overlapping squares in red/cyan/lime,
 * blended with mix-blend-mode so they bleed into each other like the
 * brief's "chromatic dispersion," kept small since it sits inline next to
 * the eyebrow label rather than as a full standalone hero illustration.
 */
function PrismAccent() {
  return (
    <div className="relative w-7 h-7 flex-shrink-0" aria-hidden="true">
      <div
        className="absolute inset-0 rounded-[2px]"
        style={{ background: 'var(--color-prism-red)', mixBlendMode: 'screen', transform: 'translate(-2px,-2px) rotate(6deg)' }}
      />
      <div
        className="absolute inset-0 rounded-[2px]"
        style={{ background: 'var(--color-prism-cyan)', mixBlendMode: 'screen', transform: 'translate(2px,0) rotate(-4deg)' }}
      />
      <div
        className="absolute inset-0 rounded-[2px]"
        style={{ background: 'var(--color-prism-lime)', mixBlendMode: 'screen', transform: 'translate(0,2px) rotate(2deg)' }}
      />
    </div>
  )
}

function Hero({ onCtaClick }: { onCtaClick: () => void }) {
  const [screen, setScreen] = useState(0)
  const screens = ['comparison', 'chat', 'alerts'] as const

  useEffect(() => {
    const id = setInterval(() => setScreen((s) => (s + 1) % screens.length), 4200)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="relative overflow-hidden bg-vivid-obsidian text-bone-white pb-24"
    >
      {/* Cinematic dimming treatment (Netflix-style layered gradients),
          built from our own palette rather than an external photo - keeps
          the flat, photo-free Vivid+Co brief intact while still giving
          the hero atmospheric depth instead of a flat single tone. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(73,87,100,0.35), transparent 60%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(73,87,100,0.2), transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, var(--color-vivid-obsidian) 0%, rgba(16,16,16,0.4) 45%, rgba(16,16,16,0.75) 100%)',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-8 pt-28 pb-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <PrismAccent />
              <span className="text-[14px] uppercase tracking-[0.02em] text-fog-blue">
                Free calculator · Updated for 2026
              </span>
            </div>

            <h1
              className="font-normal text-[clamp(40px,6vw,88px)] opacity-0"
              style={{ lineHeight: 1.03, letterSpacing: '-0.02em', animation: 'fadeUp 0.8s cubic-bezier(0.52,0.01,0,1) 0.1s forwards' }}
            >
              Know the best age to claim Social Security.
            </h1>

            <p
              className="mt-7 text-[20px] text-bone-white/70 max-w-md opacity-0"
              style={{ lineHeight: 1.5, animation: 'fadeUp 0.8s cubic-bezier(0.52,0.01,0,1) 0.3s forwards' }}
            >
              See what your benefit is worth at every age from 62 to 70 — personalized to your
              record, not an average.
            </p>

            <div
              className="mt-10 flex flex-wrap items-center gap-7 opacity-0"
              style={{ animation: 'fadeUp 0.8s cubic-bezier(0.52,0.01,0,1) 0.46s forwards' }}
            >
              <button onClick={onCtaClick} className="ov-outlined-btn">
                Calculate my benefit
              </button>
              <button
                onClick={onCtaClick}
                className="text-[14px] uppercase text-bone-white/70 hover:text-bone-white transition-colors duration-500"
                style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
              >
                I'm a financial advisor →
              </button>
            </div>
          </div>

          <div className="hover-glow-white rounded-[15px] bg-graphite-veil/30 border border-ash-border overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-black/30 border-b border-ash-border">
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
                  <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-5">Claiming comparison</div>
                  <div className="flex items-end gap-4 h-[190px] mt-6">
                    {[
                      { age: 62, val: 1890, h: 52 },
                      { age: 64, val: 2340, h: 68 },
                      { age: 67, val: 2690, h: 82, peak: true },
                      { age: 68, val: 2910, h: 90 },
                      { age: 70, val: 3320, h: 100 },
                    ].map((b) => (
                      <div key={b.age} className="flex-1 relative" style={{ height: `${b.h}%` }}>
                        <div className={`w-full h-full ${b.peak ? 'bg-bone-white' : 'bg-white/15'}`} style={{ borderRadius: '2px 2px 0 0' }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-bone-white whitespace-nowrap">
                          ${b.val.toLocaleString()}
                        </span>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-bone-white/40">
                          {b.age}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {screens[screen] === 'chat' && (
                <div>
                  <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-5">Ask Horizon</div>
                  <div className="bg-bone-white text-vivid-obsidian ml-auto max-w-[85%] rounded-[8px] px-4 py-3 text-sm mb-2.5">
                    Should I claim now or wait 2 years?
                  </div>
                  <div className="bg-graphite-veil/40 border border-ash-border text-bone-white max-w-[85%] rounded-[8px] px-4 py-3 text-sm leading-relaxed mb-2.5">
                    Waiting to 67 adds $612/mo for life. You'd break even by age 78 — after that,
                    waiting wins.
                  </div>
                  <div className="bg-bone-white text-vivid-obsidian ml-auto max-w-[85%] rounded-[8px] px-4 py-3 text-sm">
                    What if I keep working part-time?
                  </div>
                </div>
              )}
              {screens[screen] === 'alerts' && (
                <div>
                  <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-5">Rule-change alerts</div>
                  <div className="flex gap-3 bg-graphite-veil/40 border border-ash-border rounded-[8px] px-4 py-3.5 mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-bone-white mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-bone-white leading-relaxed">
                      Medicare Part B rose to $202.90/mo — your net deposit is now $2,041.
                    </p>
                  </div>
                  <div className="flex gap-3 bg-graphite-veil/40 border border-ash-border rounded-[8px] px-4 py-3.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-bone-white mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-bone-white leading-relaxed">
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
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === screen ? 'w-5 bg-bone-white' : 'w-1.5 bg-white/15'}`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
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
    <div ref={ref} className="reveal max-w-[1280px] mx-auto px-8 pt-14 grid grid-cols-2 md:grid-cols-4 border-b border-ash-border bg-vivid-obsidian text-bone-white" style={{ fontFamily: 'var(--font-vivid)' }}>
      {stats.map((s, i) => (
        <div key={s.label} className={`py-7 pr-6 ${i < stats.length - 1 ? 'md:border-r border-ash-border' : ''}`}>
          <div className="text-[clamp(22px,2.6vw,32px)] font-normal">{s.num}</div>
          <div className="text-[13px] text-fog-blue mt-1.5">{s.label}</div>
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
    <section id="how" className="max-w-[1280px] mx-auto px-8 py-28 bg-vivid-obsidian text-bone-white" style={{ fontFamily: 'var(--font-vivid)' }}>
      <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5">The problem</div>
      <h2 className="text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-3xl" style={{ letterSpacing: '-0.01em' }}>
        Every free Social Security calculator gives you a number. Nothing gives you a plan that keeps up.
      </h2>
      <div ref={ref} className="reveal grid md:grid-cols-3 gap-4 mt-12">
        {cards.map((c) => (
          <div
            key={c.n}
            className="hover-glow-white bg-graphite-veil/25 border border-ash-border rounded-[15px] p-9"
          >
            <div className="text-[13px] text-fog-blue mb-4">{c.n}</div>
            <h3 className="text-[21px] font-normal mb-2.5">{c.title}</h3>
            <p className="text-sm text-bone-white/60 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Product section ---------------- */
function ProductSection() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className="reveal mx-8">
      <div
        className="hover-glow-white max-w-[1280px] mx-auto bg-muted-grey/25 text-bone-white rounded-[15px] px-10 md:px-14 py-16 relative overflow-hidden border border-ash-border"
        style={{ fontFamily: 'var(--font-vivid)' }}
      >
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5">Your actual numbers</div>
        <h2 className="text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-2xl" style={{ letterSpacing: '-0.01em' }}>
          Not an estimate. Your record, run against every claiming age.
        </h2>
        <p className="mt-4 text-bone-white/60 max-w-lg leading-relaxed">
          Enter your earnings history — or photograph your SSA statement — and Horizon models
          exactly what changes at 62, at full retirement age, and at 70.
        </p>
        <div className="flex gap-10 mt-10 flex-wrap">
          <div>
            <div className="text-2xl font-normal">+$612</div>
            <div className="text-[13px] text-fog-blue mt-1">monthly gain, 62 → 67</div>
          </div>
          <div>
            <div className="text-2xl font-normal">+$1,430</div>
            <div className="text-[13px] text-fog-blue mt-1">monthly gain, 62 → 70</div>
          </div>
          <div>
            <div className="text-2xl font-normal">10.5 yrs</div>
            <div className="text-[13px] text-fog-blue mt-1">breakeven vs. claiming early</div>
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
    <section id="features" className="max-w-[1280px] mx-auto px-8 py-28 bg-vivid-obsidian text-bone-white" style={{ fontFamily: 'var(--font-vivid)' }}>
      <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5">What's inside</div>
      <h2 className="text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-3xl mb-12" style={{ letterSpacing: '-0.01em' }}>
        A plan that talks back, reads your mail, and tells you when something changes.
      </h2>
      <div ref={ref} className="reveal grid grid-cols-2 md:grid-cols-4 auto-rows-[130px] gap-4">
        <div className="hover-glow-white col-span-2 row-span-2 rounded-[15px] bg-graphite-veil/30 border border-ash-border p-7">
          <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-3.5">AI assistant · Ask, in plain english</div>
          <h3 className="text-xl font-normal mb-2.5">"Should I claim now, or wait two years?"</h3>
          <p className="text-sm text-bone-white/60">Horizon's assistant answers using your actual saved numbers.</p>
        </div>
        <div className="hover-glow-white rounded-[15px] bg-graphite-veil/15 border border-ash-border p-7">
          <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-3.5">Coordination</div>
          <h3 className="text-xl font-normal mb-2.5">Spousal &amp; survivor</h3>
          <p className="text-sm text-bone-white/60">Maximize household lifetime benefit.</p>
        </div>
        <div className="hover-glow-white rounded-[15px] bg-graphite-veil/15 border border-ash-border p-7">
          <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-3.5">Mail, decoded</div>
          <h3 className="text-xl font-normal mb-2.5">Upload the letter</h3>
          <p className="text-sm text-bone-white/60">Get a plain-English answer instantly.</p>
        </div>
        <div className="hover-glow-white col-span-2 rounded-[15px] bg-graphite-veil/15 border border-ash-border p-7">
          <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-3.5">Stay current · Alerts</div>
          <h3 className="text-xl font-normal mb-2.5">Rule-change alerts, personalized</h3>
          <p className="text-sm text-bone-white/60">"The Fairness Act repeal added an estimated $340/mo to your benefit."</p>
        </div>
        <div className="hover-glow-white col-span-2 row-span-2 rounded-[15px] bg-graphite-veil/30 border border-ash-border p-7">
          <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-3.5">Scenario modeling</div>
          <h3 className="text-xl font-normal mb-2.5">"What if benefits get cut?"</h3>
          <p className="text-sm text-bone-white/60">Model a possible trust-fund-depletion cut against your real numbers.</p>
        </div>
        <div className="hover-glow-white col-span-2 rounded-[15px] bg-graphite-veil/15 border border-ash-border p-7">
          <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-3.5">WEP / GPO aware</div>
          <h3 className="text-xl font-normal mb-2.5">Public-service pensions, handled correctly</h3>
          <p className="text-sm text-bone-white/60">Reflects the 2025 Fairness Act repeal automatically.</p>
        </div>
      </div>
    </section>
  )
}

/* ---------------- FAQ ---------------- */
function FaqSection() {
  const [open, setOpen] = useState(0)
  const ref = useReveal<HTMLDivElement>()
  const faqs = [
    { q: 'What is the best age to claim Social Security?', a: 'There is no single best age for everyone — it depends on your health, other income, and household situation. Claiming at 62 reduces your monthly benefit permanently, while waiting until 70 increases it.' },
    { q: 'How much does Social Security increase if I wait to claim?', a: 'Delaying benefits past full retirement age adds delayed retirement credits worth roughly 8% per year, up until age 70. Claiming before full retirement age instead reduces your benefit, by as much as 30% at age 62.' },
    { q: 'What is full retirement age (FRA) in 2026?', a: 'For anyone born in 1960 or later, full retirement age is 67 — the final step of a phase-in that began with 1983 legislation.' },
    { q: 'Does working while claiming Social Security reduce my benefit?', a: 'If you claim before full retirement age and continue working, Social Security withholds a portion of your benefit above an annual earnings limit. That no longer applies once you reach full retirement age.' },
  ]
  return (
    <section id="faq" className="max-w-[1280px] mx-auto px-8 py-28 bg-vivid-obsidian text-bone-white" style={{ fontFamily: 'var(--font-vivid)' }}>
      <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5">Common questions</div>
      <h2 className="text-[clamp(28px,3.6vw,46px)] font-normal leading-tight max-w-3xl mb-10" style={{ letterSpacing: '-0.01em' }}>
        Social Security claiming — answered plainly.
      </h2>
      <div ref={ref} className="reveal max-w-2xl">
        {faqs.map((f, i) => (
          <div key={f.q} className="border-b border-ash-border transition-colors duration-300 hover:bg-graphite-veil/10 rounded-[5px]">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full text-left py-5 px-3 flex items-center justify-between gap-5 font-normal"
            >
              {f.q}
              <span
                className={`text-lg text-fog-blue transition-transform duration-500 flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
              >
                +
              </span>
            </button>
            {open === i && <p className="text-sm text-bone-white/60 leading-relaxed pb-5 px-3 max-w-xl">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Final CTA ---------------- */
function FinalCta({ onCtaClick }: { onCtaClick: () => void }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section className="text-center px-8 py-32 bg-vivid-obsidian text-bone-white" style={{ fontFamily: 'var(--font-vivid)' }}>
      <div ref={ref} className="reveal">
        <h2 className="text-[clamp(30px,4.6vw,56px)] font-normal leading-tight max-w-2xl mx-auto mb-8" style={{ letterSpacing: '-0.01em' }}>
          Your number is waiting. It takes five minutes to see it.
        </h2>
        <button onClick={onCtaClick} className="ov-outlined-btn">
          Calculate my benefit
        </button>
      </div>
    </section>
  )
}

/* ---------------- /Landing sections ---------------- */
