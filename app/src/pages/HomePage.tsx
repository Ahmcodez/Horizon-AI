import { useEffect, useState, createElement, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useReveal } from '../lib/useReveal'
import '../homepage.css'

/**
 * The public marketing homepage - ported from the standalone landing/
 * static site into a real app route now that the app and the marketing
 * site live on one domain (see App.tsx: "/" renders this, not a redirect
 * to /login). Uses homepage.css (a copy of landing/style.css) rather than
 * the app's own Tailwind/index.css classes, since it's a straight visual
 * port of that design.
 *
 * Known trade-off: this is now client-rendered like the rest of the SPA,
 * not pre-rendered static HTML - a real (if partial) step down in SEO
 * reliability from the dedicated static site, accepted in exchange for a
 * single domain. index.html carries baseline title/meta/JSON-LD for the
 * pre-hydration HTML; the effect below overrides the title for in-app
 * client-side navigation to "/".
 */

/** Wraps an element in the .reveal scroll-in-view animation via useReveal(). */
function Reveal({
  children,
  className = '',
  tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  tag?: string
  [key: string]: unknown
}) {
  const ref = useReveal<HTMLElement>()
  return createElement(tag, { ref, className: `reveal ${className}`.trim(), ...rest }, children)
}

const TESTIMONIALS = [
  {
    quote:
      '"The dashboard showed waiting to 70 was worth $91,500 more over my expected lifespan, with a breakeven age of about 80. That\'s the number that finally made the decision easy."',
    avatar: 'https://i.pravatar.cc/80?img=12',
    name: 'Diane R.',
    role: 'Pre-retiree, age 61',
  },
  {
    quote:
      '"My spouse and I were about to claim at the same age. MyClaimAge showed us a staggered strategy that added real money to our household total, and the assistant answered every follow-up question we had."',
    avatar: 'https://i.pravatar.cc/80?img=33',
    name: 'Marcus T.',
    role: 'Married, age 64',
  },
  {
    quote:
      "\"I didn't realize how much Medicare and taxes would eat into my check until I saw the net deposit, not just the gross benefit. It changed which age I'm actually planning around.\"",
    avatar: 'https://i.pravatar.cc/80?img=68',
    name: 'Robert K.',
    role: 'Age 63',
  },
  {
    quote:
      '"I manage 80 client files. Being able to pull a claiming report in two minutes instead of an hour changed how many clients I can actually serve."',
    avatar: 'https://i.pravatar.cc/80?img=47',
    name: 'Priya K.',
    role: 'Financial advisor',
  },
]

const FAQS = [
  {
    q: 'What is the best age to claim Social Security?',
    a: (
      <>
        There is no single best age for everyone — it depends on your health, other income, and household
        situation. Claiming at 62 reduces your monthly benefit permanently, while waiting until 70 increases it.
        MyClaimAge models your specific numbers across every age from 62 to 70 so you can compare the real dollar
        difference for your situation. See the full{' '}
        <a href="/guides/social-security-62-vs-67.html">62 vs. 67 breakdown</a> for the exact math.
      </>
    ),
  },
  {
    q: 'How much does Social Security increase if I wait to claim?',
    a: 'Delaying benefits past full retirement age adds delayed retirement credits worth roughly 8% per year, up until age 70. Claiming before full retirement age instead reduces your benefit, by as much as 30% at age 62.',
  },
  {
    q: 'What is full retirement age (FRA) in 2026?',
    a: 'For anyone born in 1960 or later, full retirement age is 67 — the final step of a phase-in that began with 1983 legislation.',
  },
  {
    q: 'Does working while claiming Social Security reduce my benefit?',
    a: 'If you claim before full retirement age and continue working, Social Security withholds a portion of your benefit above an annual earnings limit. The limit and withholding rules change each year and no longer apply once you reach full retirement age.',
  },
  {
    q: 'Is Social Security taxable?',
    a: 'It can be. Depending on your combined income from all sources, up to 85% of your benefit may be subject to federal income tax, and a handful of states tax it too. MyClaimAge factors this into the net numbers it shows you, rather than just the gross benefit amount.',
  },
  {
    q: 'How does Medicare affect my Social Security check?',
    a: 'Once you\u2019re enrolled, your Medicare Part B premium is deducted automatically from your Social Security payment, and higher earners pay an additional IRMAA surcharge. MyClaimAge shows your net deposit after Medicare, not just the pre-deduction benefit amount.',
  },
  {
    q: 'How do I know if a Social Security rule change affects me?',
    a: 'MyClaimAge checks SSA, IRS, and CMS filings every day and flags genuine benefit-relevant changes — like a COLA update or a change to WEP/GPO rules — against your own saved profile, so you only hear about the changes that actually apply to you.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [testiIndex, setTestiIndex] = useState(0)
  const [faqOpen, setFaqOpen] = useState<number | null>(0)

  useEffect(() => {
    document.title = 'When to Claim Social Security | MyClaimAge Calculator'
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTestiIndex((i) => (i + 1) % TESTIMONIALS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  function goToSignup() {
    navigate('/login?mode=signup')
  }

  return (
    <main id="top">
      <section className="hero-v2" aria-label="Introduction">
        <div className="hero-v2-inner">
          <nav className="breadcrumb-v2" aria-label="Breadcrumb">
            <a href="#top">MyClaimAge</a>
            <span>/</span>Social Security Claiming Planner
          </nav>

          <h1 className="hero-v2-title">
            Know exactly <span className="gradient-text">when to claim</span> Social Security.
          </h1>
          <p className="hero-v2-sub">
            One decision, made once, that can move your lifetime income by six figures. MyClaimAge shows you the
            real numbers — yours, not an average — at every claiming age from 62 to 70, plus how Medicare and taxes
            change what actually lands in your account.
          </p>

          <div className="quickstart-row">
            <div className="quickstart-pill">
              <input
                type="number"
                className="quickstart-input"
                placeholder="Enter your birth year, e.g. 1965"
                aria-label="Birth year"
                min={1930}
                max={2010}
              />
              <button type="button" className="btn-gradient-pill" onClick={goToSignup}>
                Get my number
              </button>
            </div>
            <a className="btn-outline-pill" href="#compare">
              See a sample report
            </a>
          </div>

          <figure className="hero-preview-frame">
            <img
              src="/images/dashboard.png"
              alt="MyClaimAge claiming-age comparison dashboard: a $3,050 monthly benefit at full retirement age 67, a $91,500 lifetime gain from waiting to 70 versus 62, an 80.4 breakeven age, and a bar chart of the benefit amount at every claiming age from 62 to 70"
              width={1270}
              height={524}
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      <section className="trust-strip-v2" aria-label="Key Social Security numbers for 2026">
        <div className="trust-chips-v2">
          <span>2026 COLA applied</span>
          <span className="sep">·</span>
          <span>Built on IRS Pub 915, SSA rules &amp; CMS Medicare data</span>
          <span className="sep">·</span>
          <span>Not affiliated with the SSA</span>
          <span className="sep">·</span>
          <span>Informational only</span>
        </div>
        <div className="trust-stats-v2">
          <div className="trust-stat-v2">
            <div className="num">
              <span className="accent">+31%</span>
            </div>
            <div className="lbl">benefit increase, claiming at 70 vs. 62</div>
          </div>
          <div className="trust-stat-v2">
            <div className="num">
              $214<span className="accent">k</span>
            </div>
            <div className="lbl">average lifetime difference between strategies</div>
          </div>
          <div className="trust-stat-v2">
            <div className="num">
              <span className="accent">2032</span>
            </div>
            <div className="lbl">projected trust fund depletion year</div>
          </div>
          <div className="trust-stat-v2">
            <div className="num">40</div>
            <div className="lbl">work credits needed to qualify</div>
          </div>
        </div>
      </section>

      <section className="why-v2" aria-labelledby="why-v2-heading">
        <h2 className="why-v2-title" id="why-v2-heading">
          Why people planning retirement choose MyClaimAge
        </h2>
        <p className="why-v2-sub">Not a generic estimate — a plan built on your numbers and the actual rules.</p>
        <div className="why-cards-v2">
          <Reveal tag="div" className="why-card-v2 d1">
            <div className="why-icon">1</div>
            <h3>Grounded in your own numbers</h3>
            <p>Every figure comes from your actual earnings record, not a national average dressed up as a personal estimate.</p>
          </Reveal>
          <Reveal tag="div" className="why-card-v2 d2">
            <div className="why-icon">2</div>
            <h3>The whole picture, not one number</h3>
            <p>Benefits, Medicare premiums, and taxes calculated together, so you see your real net deposit, not just the gross benefit.</p>
          </Reveal>
          <Reveal tag="div" className="why-card-v2 d3">
            <div className="why-icon">3</div>
            <h3>Built on the actual rules</h3>
            <p>IRS Pub 915 worksheets, CMS IRMAA brackets, and the SSA's own tables — not rules of thumb or rounded averages.</p>
          </Reveal>
          <Reveal tag="div" className="why-card-v2 d4">
            <div className="why-icon">4</div>
            <h3>Stays current automatically</h3>
            <p>Checks SSA, IRS, and CMS filings every day and tells you when a real rule change affects your plan.</p>
          </Reveal>
        </div>
        <p className="why-fineprint-v2">MyClaimAge is a new product — this reflects our design principles, not a customer count claim.</p>
      </section>

      <div className="section-divider" aria-hidden="true">
        <div className="line" />
        <div className="marker" />
        <div className="line" />
      </div>

      <section className="block" id="when-to-claim" aria-labelledby="when-heading">
        <Reveal tag="div" className="eyebrow-label">The core decision</Reveal>
        <Reveal tag="h2" className="section-title d1" id="when-heading">When should you claim Social Security?</Reveal>
        <Reveal tag="p" className="section-sub d2">
          There's no single right age — the SSA lets you claim any time between 62 and 70, and the amount changes
          permanently depending on when you do. Claiming at 62 locks in a reduced check for life; waiting until 70
          locks in the largest one the SSA will pay you. The right age for you depends on a handful of factors most
          calculators never ask about.
        </Reveal>

        <Reveal tag="div" className="when-grid d3">
          <div className="when-copy">
            <p>
              Because the decision is permanent, it's worth treating like the six-figure decision it usually is
              rather than a form to get through quickly. A three-year difference in claiming age can move your
              lifetime income by well over $100,000 depending on how long you live and what else you have coming
              in.
            </p>
            <p>
              MyClaimAge runs your actual earnings record — not a national average — against every age from 62 to
              70, so you can see your own numbers before you decide. See the{' '}
              <a href="/guides/social-security-62-vs-67.html">full 62 vs. 67 vs. 70 breakdown</a> for the exact
              math, or <a href="#compare">jump to the comparison below</a>.
            </p>
          </div>
          <ul className="factor-list">
            <li>
              <strong>Your health and family longevity.</strong> A longer expected lifespan generally favors
              waiting; a shorter one generally favors claiming earlier.
            </li>
            <li>
              <strong>Other income and savings.</strong> If you need the income at 62, waiting may not be realistic
              regardless of the math.
            </li>
            <li>
              <strong>Marital status.</strong> Spousal and survivor benefits depend on both partners' claiming
              ages, not just your own.
            </li>
            <li>
              <strong>Whether you're still working.</strong> Earning above the annual limit before full retirement
              age temporarily withholds part of your benefit.
            </li>
            <li>
              <strong>Your breakeven age.</strong> The age where a later, larger check catches up to an earlier,
              smaller one that's been paid longer.
            </li>
          </ul>
        </Reveal>
      </section>

      <Reveal tag="div" className="product-section" aria-labelledby="product-heading">
        <div className="product-inner">
          <div className="eyebrow-label">Your actual numbers</div>
          <h2 className="section-title" id="product-heading">
            Not an estimate. Your record, run against every claiming age.
          </h2>
          <p className="section-sub">
            Enter your earnings history — or photograph your SSA statement — and MyClaimAge models exactly what
            changes at 62, at full retirement age, and at 70.
          </p>

          <figure className="product-image-frame">
            <img
              src="/images/dashboard.png"
              alt="MyClaimAge claiming-age comparison dashboard: a $3,050 monthly benefit at full retirement age 67, a $91,500 lifetime gain from waiting to 70 versus 62, an 80.4 breakeven age, and a bar chart of the benefit amount at every claiming age from 62 to 70"
              width={1270}
              height={524}
              loading="lazy"
            />
          </figure>
        </div>
      </Reveal>

      <div className="section-divider" aria-hidden="true">
        <div className="line" />
        <div className="marker" />
        <div className="line" />
      </div>

      <section className="block" id="how" aria-labelledby="how-heading">
        <Reveal tag="div" className="eyebrow-label">How it works</Reveal>
        <Reveal tag="h2" className="section-title d1" id="how-heading">
          From your earnings record to a claiming-age plan you can act on.
        </Reveal>
        <Reveal tag="p" className="section-sub d2">Four steps, most of them done for you.</Reveal>

        <Reveal tag="div" className="steps-grid-v2 d3">
          <article className="step-card-v2">
            <div className="step-num-v2">01</div>
            <h3>Enter your earnings</h3>
            <p>Type in your work history, or photograph your SSA statement and let MyClaimAge read it for you.</p>
          </article>
          <article className="step-card-v2">
            <div className="step-num-v2">02</div>
            <h3>Compare every age</h3>
            <p>See your real monthly benefit at every age from 62 to 70, including spousal, survivor, and WEP/GPO adjustments where they apply.</p>
          </article>
          <article className="step-card-v2">
            <div className="step-num-v2">03</div>
            <h3>Ask about your plan</h3>
            <p>Ask the assistant plan-specific questions in plain English, answered from your own saved numbers.</p>
          </article>
          <article className="step-card-v2">
            <div className="step-num-v2">04</div>
            <h3>Get alerts that matter</h3>
            <p>MyClaimAge checks SSA, IRS, and CMS filings daily and tells you when a real change affects your plan.</p>
          </article>
        </Reveal>
      </section>

      <section className="block" id="features" aria-labelledby="features-heading">
        <Reveal tag="div" className="eyebrow-label">Core features</Reveal>
        <Reveal tag="h2" className="section-title d1" id="features-heading">
          A plan that talks back, reads your mail, and tells you when something changes.
        </Reveal>

        <Reveal tag="div" className="bento d2">
          <article className="bento-cell dark b-1">
            <div className="bento-label">Ask, in plain english</div>
            <h3>"Should I claim now, or wait two years?"</h3>
            <p>MyClaimAge's assistant answers using your actual saved numbers — not a rule of thumb.</p>
            <div className="mini-chat">
              <div className="mini-bubble">If you claim at 63 and earn $18k/yr part-time, none of it gets withheld.</div>
              <div className="mini-bubble user">What about at 65?</div>
            </div>
          </article>

          <figure className="bento-cell image-cell b-3">
            <div className="placeholder-img-wrap">
              <img
                src="/images/document-reader.png"
                alt="MyClaimAge document reader showing a plain-English explanation of an uploaded SSA-89 form, including who requested it and whether any action is needed"
                width={722}
                height={525}
                loading="lazy"
              />
              <figcaption className="placeholder-caption">Mail, decoded</figcaption>
            </div>
          </figure>

          <article className="bento-cell amber b-4">
            <div className="bento-label">Coordination</div>
            <h3>Spousal &amp; survivor</h3>
            <p>Maximize household lifetime benefit, together.</p>
          </article>

          <article className="bento-cell light b-6">
            <div className="bento-label">Stay current</div>
            <h3>Rule-change alerts, personalized</h3>
            <p>
              "The Fairness Act repeal added an estimated $340/mo to your benefit." <a href="#alerts">See how alerts work →</a>
            </p>
          </article>

          <article className="bento-cell dark b-5">
            <div className="bento-label">Scenario modeling</div>
            <h3>"What if I get laid off at 63?"</h3>
            <p>Ask in your own words — MyClaimAge runs the real calculation behind it.</p>
            <div className="mini-bars">
              <div className="mini-bar dim" style={{ height: '40%' }} />
              <div className="mini-bar dim" style={{ height: '58%' }} />
              <div className="mini-bar" style={{ height: '78%' }} />
              <div className="mini-bar dim" style={{ height: '65%' }} />
              <div className="mini-bar" style={{ height: '92%' }} />
            </div>
          </article>

          <article className="bento-cell light b-2">
            <div className="bento-label">WEP / GPO aware</div>
            <h3>Public-service pensions, handled correctly</h3>
            <p>Reflects the 2025 Social Security Fairness Act repeal automatically.</p>
          </article>
        </Reveal>
      </section>

      <div className="section-divider" aria-hidden="true">
        <div className="line" />
        <div className="marker" />
        <div className="line" />
      </div>

      <section className="block" id="compare" aria-labelledby="compare-heading">
        <Reveal tag="div" className="eyebrow-label">62 vs. 67 vs. 70</Reveal>
        <Reveal tag="h2" className="section-title d1" id="compare-heading">Three ages, three very different checks.</Reveal>
        <Reveal tag="p" className="section-sub d2">
          Illustrative numbers for someone with a $2,690/mo benefit at full retirement age (67). Your own numbers
          will differ — this is the shape of the tradeoff, not a prediction.
        </Reveal>

        <Reveal tag="div" className="problem-grid d3">
          <article className="problem-card">
            <div className="problem-num">62</div>
            <h3>$1,890/mo</h3>
            <p>The earliest claiming age. Reduces your benefit by up to 30% compared to full retirement age, permanently. Often the right call if you need the income now or don't expect a long retirement.</p>
          </article>
          <article className="problem-card">
            <div className="problem-num">67</div>
            <h3>$2,690/mo</h3>
            <p>Full retirement age for anyone born in 1960 or later. No reduction and no delayed credit — this is your Primary Insurance Amount, the baseline every other age is measured against.</p>
          </article>
          <article className="problem-card">
            <div className="problem-num">70</div>
            <h3>$3,320/mo</h3>
            <p>The last age delayed retirement credits accrue — roughly 8% per year past full retirement age. The largest possible check, if you can afford to wait and expect to need income for a long retirement.</p>
          </article>
        </Reveal>
        <Reveal tag="p" className="compare-footnote d4">
          Read the <a href="/guides/social-security-62-vs-67.html">full 62 vs. 67 breakdown</a>, including
          breakeven-age math, for the exact numbers behind this comparison.
        </Reveal>
      </section>

      <section className="block" id="taxes-medicare" aria-labelledby="taxes-heading">
        <Reveal tag="div" className="eyebrow-label">The part most calculators skip</Reveal>
        <Reveal tag="h2" className="section-title d1" id="taxes-heading">Taxes and Medicare change what actually lands in your account.</Reveal>
        <Reveal tag="p" className="section-sub d2">Your gross benefit and your net deposit are two different numbers. MyClaimAge shows both.</Reveal>

        <Reveal tag="div" className="info-duo d3">
          <article className="info-card">
            <h3>Federal (and sometimes state) taxes</h3>
            <p>Depending on your combined income from all sources, up to 85% of your Social Security benefit can be subject to federal income tax. A handful of states tax it too, on top of federal. MyClaimAge factors your likely tax exposure into the comparison, rather than only showing the gross benefit.</p>
          </article>
          <article className="info-card">
            <h3>Medicare Part B and IRMAA</h3>
            <p>
              Once you're enrolled, your Medicare Part B premium — $202.90/mo at the standard 2026 rate — is
              deducted automatically from your check. Higher earners pay an additional IRMAA surcharge on top.
              MyClaimAge shows your <a href="#pricing">net deposit after Medicare</a>, so the number you see is the
              one you'll actually receive.
            </p>
          </article>
        </Reveal>
      </section>

      <div className="section-divider" aria-hidden="true">
        <div className="line" />
        <div className="marker" />
        <div className="line" />
      </div>

      <section className="block" id="alerts" aria-labelledby="alerts-heading">
        <Reveal tag="div" className="eyebrow-label">Rule-change alerts</Reveal>
        <Reveal tag="h2" className="section-title d1" id="alerts-heading">The rules move every year. Your plan should keep up automatically.</Reveal>
        <Reveal tag="p" className="section-sub d2">
          MyClaimAge checks SSA, IRS, and CMS filings every day, and uses AI to tell the difference between routine
          noise and a change that's actually worth knowing about. When something changes, it checks it against
          your own saved profile before deciding whether to tell you — WEP/GPO updates, for example, only go to
          people with a non-covered pension.
        </Reveal>

        <Reveal tag="div" className="alert-showcase d3">
          <div className="alert-card">
            <div className="s-alert-dot" />
            <div>
              <p>Medicare Part B rose to $202.90/mo — your net deposit is now $2,303.</p>
              <small>2 days ago</small>
            </div>
          </div>
          <div className="alert-card">
            <div className="s-alert-dot" />
            <div>
              <p>The Fairness Act repeal added an estimated $340/mo to your benefit.</p>
              <small>Last week</small>
            </div>
          </div>
          <div className="alert-card">
            <div className="s-alert-dot" />
            <div>
              <p>2026 COLA applied — your benefit estimate increased across every claiming age.</p>
              <small>This year</small>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="block" id="testimonials" aria-labelledby="testimonials-heading">
        <Reveal tag="div" className="eyebrow-label">Sample feedback</Reveal>
        <Reveal tag="h2" className="section-title d1" id="testimonials-heading">What early testers are saying.</Reveal>
        <Reveal tag="div" className="testi-carousel d2">
          <div className="testi-track">
            {TESTIMONIALS.map((t, i) => (
              <article key={t.name} className={`testi-slide t-card ${i === testiIndex ? 'active' : ''}`}>
                <p className="t-quote">{t.quote}</p>
                <div className="t-person">
                  <img className="t-avatar" src={t.avatar} alt="Placeholder avatar for sample testimonial" />
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                </div>
                <div className="sample-tag">Sample quote — placeholder for design</div>
              </article>
            ))}
          </div>
          <div className="testi-dots">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                className={`testi-dot ${i === testiIndex ? 'active' : ''}`}
                aria-label={`Show testimonial from ${t.name}`}
                onClick={() => setTestiIndex(i)}
              />
            ))}
          </div>
        </Reveal>
      </section>

      <div className="section-divider" aria-hidden="true">
        <div className="line" />
        <div className="marker" />
        <div className="line" />
      </div>

      <section className="block" id="guides" aria-labelledby="guides-heading">
        <Reveal tag="div" className="eyebrow-label">Educational guides</Reveal>
        <Reveal tag="h2" className="section-title d1" id="guides-heading">Read the math behind the numbers.</Reveal>
        <Reveal tag="p" className="section-sub d2">Plain-English guides to the Social Security decisions that come up most.</Reveal>

        <Reveal tag="div" className="guides-grid d3">
          <a className="guide-card" href="/guides/social-security-62-vs-67.html">
            <div className="bento-label">Guide</div>
            <h3>Social Security at 62 vs. 67: the full breakdown</h3>
            <p>The exact monthly and lifetime math behind claiming early versus waiting for full retirement age, including breakeven-age calculations.</p>
            <span className="path-arrow">
              Read the guide <span>→</span>
            </span>
          </a>
          <div className="guide-card coming-soon">
            <div className="bento-label">Coming soon</div>
            <h3>Spousal &amp; survivor benefits, explained</h3>
            <p>How claiming ages between spouses interact, and what happens to a survivor's benefit after a spouse passes away.</p>
          </div>
          <div className="guide-card coming-soon">
            <div className="bento-label">Coming soon</div>
            <h3>IRMAA and Medicare surcharges</h3>
            <p>How higher income can raise your Medicare premium, and what that does to your net Social Security deposit.</p>
          </div>
        </Reveal>
      </section>

      <section className="block" id="faq" aria-labelledby="faq-heading">
        <Reveal tag="div" className="eyebrow-label">Common questions</Reveal>
        <Reveal tag="h2" className="section-title d1" id="faq-heading">Social Security claiming — answered plainly.</Reveal>

        <Reveal tag="div" className="faq-list d2">
          {FAQS.map((item, i) => {
            const open = faqOpen === i
            return (
              <div key={item.q} className={`faq-item ${open ? 'open' : ''}`}>
                <button
                  className="faq-question"
                  aria-expanded={open}
                  onClick={() => setFaqOpen((prev) => (prev === i ? null : i))}
                >
                  {item.q}
                  <span className="plus">{open ? '×' : '+'}</span>
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            )
          })}
        </Reveal>
      </section>

      <section className="block" id="pricing" aria-labelledby="pricing-heading">
        <Reveal tag="div" className="eyebrow-label">Pricing</Reveal>
        <Reveal tag="h2" className="section-title d1" id="pricing-heading">Start free. Upgrade when you're ready to see the full picture.</Reveal>

        <Reveal tag="div" className="pricing-grid d2">
          <article className="price-card">
            <div className="price-tier">Free</div>
            <h3 className="price-amount">$0</h3>
            <div className="price-desc">A real first look at your options.</div>
            <ul className="price-features">
              <li><span className="check">✓</span> Single claiming-age estimate</li>
              <li><span className="check">✓</span> FRA &amp; delayed credit calculation</li>
              <li><span className="check">✓</span> 2026 COLA applied</li>
            </ul>
          </article>
          <article className="price-card featured">
            <div className="price-tag">Most chosen</div>
            <div className="price-tier">Plan</div>
            <h3 className="price-amount">
              $12<sub>/mo</sub>
            </h3>
            <div className="price-desc">The full picture, kept current every year.</div>
            <ul className="price-features">
              <li><span className="check">✓</span> Spousal &amp; survivor coordination</li>
              <li><span className="check">✓</span> WEP/GPO-aware calculations</li>
              <li><span className="check">✓</span> Medicare IRMAA impact</li>
              <li><span className="check">✓</span> AI assistant &amp; document reader</li>
              <li><span className="check">✓</span> Annual re-check &amp; rule alerts</li>
            </ul>
          </article>
          <article className="price-card" id="advisors">
            <div className="price-tier">Advisor</div>
            <h3 className="price-amount">
              $149<sub>/mo</sub>
            </h3>
            <div className="price-desc">For advisors managing a full client book.</div>
            <ul className="price-features">
              <li><span className="check">✓</span> Unlimited client profiles</li>
              <li><span className="check">✓</span> Client-ready PDF reports</li>
              <li><span className="check">✓</span> Book-wide rule-change alerts</li>
            </ul>
          </article>
        </Reveal>
      </section>

      <Reveal tag="section" className="final-cta" aria-labelledby="final-cta-heading">
        <h2 id="final-cta-heading">
          Your number is waiting. <span className="accent-fill">It takes five minutes to see it.</span>
        </h2>
        <Link to="/login?mode=signup" className="btn-primary">
          Calculate my benefit — free
        </Link>
      </Reveal>
    </main>
  )
}
