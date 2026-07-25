# Product Requirements Document (PRD)
## Product Codename: **SecureAge** (working title — rename before launch)
### Category: AI-Powered Social Security & Retirement Planning Platform

**Version:** 1.0 Draft
**Owner:** [Your name]
**Last updated:** July 2026

---

## 1. Executive Summary

SecureAge is a personalized, AI-powered retirement planning app that helps U.S. citizens make one of the most consequential and irreversible financial decisions of their lives — when and how to claim Social Security — with the same sophistication previously available only to clients of paid financial advisors.

Unlike existing free calculators (SSA.tools, Social Security Wiz) or one-time paid tools (Maximize My Social Security), SecureAge is built as a **living relationship**, not a one-time calculation: it holds the user's real earnings profile, monitors real government rule changes, and proactively tells them what's changed and what to do about it — in plain English, on demand, through a conversational AI layer.

**Primary business model:** Freemium subscription (consumer) + white-label seats (financial advisors).
**Target:** $10K MRR within 12 months of launch via ~700–1,000 consumer subscribers or ~60–100 advisor seats (or a blend).

---

## 2. Problem Statement

| Problem | Why it matters |
|---|---|
| Claiming Social Security is irreversible and the difference between claiming ages can exceed $100K–$300K in lifetime benefits | Most people claim early without understanding the true cost |
| Existing calculators are static, generic, and forgotten after one use | No retention, no repeat engagement, no recurring revenue |
| Rules change yearly (COLA, earnings limits, tax law like the 2025 OBBBA senior deduction, WEP/GPO repeal) | Nobody re-checks their plan when rules shift — stale plans lead to bad decisions |
| SSA/IRS/Medicare official communications are dense and intimidating | People ignore or misunderstand letters that require action |
| Financial advisors use clunky, expensive legacy software (or Excel) for claiming analysis | Time-consuming client prep, hard to scale |
| Trust fund depletion (~2032–2033) is a looming, anxiety-inducing headline | No consumer tool helps people plan for a "what if benefits get cut" scenario |

---

## 3. Goals & Non-Goals

### Goals
- Deliver **personalized, accurate, explainable** Social Security and retirement guidance
- Make the app something people **return to repeatedly**, not a single-use calculator
- Differentiate through **AI-native features** (conversational assistant, document reading, natural-language scenario modeling)
- Ship a **premium, modern UI** — this is a trust product; visual polish directly impacts perceived credibility and conversion
- Build a monetization engine that scales from consumer subscriptions to advisor B2B seats

### Non-Goals (v1)
- Not a full financial advisory platform (no investment management, no brokerage integration)
- Not a licensed fiduciary advice product — informational/educational only, with clear disclaimers
- No open user-to-user community/forum in v1 (moderation and liability risk deferred to later phase)
- No mobile-native apps in v1 — responsive web app first (React), native wrapper later if traction supports it

---

## 4. Target Users & Personas

**Persona 1 — "Pre-Retiree Pete" (primary consumer)**
Age 58–64, approaching claiming decision, has a rough idea of his SSA estimate, anxious about trust fund headlines, wants clarity without hiring an advisor.

**Persona 2 — "Dual-Income Dana" (spousal coordination)**
Age 55–65, married, wants to know how to coordinate claiming with her spouse to maximize household lifetime benefit.

**Persona 3 — "Public-Servant Paul" (WEP/GPO affected)**
Former teacher/firefighter with a non-covered pension, directly affected by the 2025 Social Security Fairness Act, needs updated numbers reflecting the repeal.

**Persona 4 — "Advisor Amy" (B2B)**
Independent financial advisor or CPA managing 50–200 clients, needs fast, presentable, defensible claiming-strategy reports for client meetings.

---

## 5. Competitive Landscape (Summary)

| Competitor | Model | Gap SecureAge exploits |
|---|---|---|
| SSA.tools | Free, static calculator | No personalization, no follow-up, no AI |
| Social Security Wiz | Free, spousal/survivor calc | No account, no monitoring over time |
| Maximize My Social Security | One-time paid (~$40–50) | No ongoing relationship, dated UI, no AI |
| RetirementAdvisorPro | B2B, advisor-only | Not available direct-to-consumer |
| Generic finance blogs/lead-gen calculators | Free, ad/lead-driven | Shallow, not personalized, not trustworthy long-term |

**SecureAge's moat:** personalized ongoing monitoring + conversational AI + polished UX + dual consumer/advisor monetization.

---

## 6. Feature Set

### 6.1 MVP (Phase 1 — Launch)

**Core Calculation Engine**
- Claiming-age comparison (62–70), PIA/AIME calculation from real bend-point formula
- Spousal & survivor benefit coordination
- Earnings test modeling for those claiming while working
- WEP/GPO-aware calculations (reflecting Social Security Fairness Act repeal)
- Breakeven age analysis with visual lifetime-benefit chart

**Account & Data**
- Secure account creation, encrypted storage of birth date, earnings history, marital status, pension status
- Manual entry + **photo/OCR intake of SSA statement** to reduce onboarding friction

**AI Assistant (core differentiator)**
- Natural-language Q&A grounded in the user's saved profile ("Should I claim now or wait 2 years?")
- "Explain my number" — tap any output figure for a personalized plain-English explanation
- Document reader: upload an SSA/IRS/Medicare letter → AI summarizes what it means and whether action is needed

**Update & Retention Engine**
- Automated monitoring pipeline (SSA.gov, IRS.gov, CMS.gov feeds) for COLA, tax law, and Medicare premium changes
- Personalized "impact summary" notification generated per user when a relevant rule changes
- Milestone-based nudges (birthday-driven: "you turn 62 in 6 months")

**Monetization**
- Freemium: free basic single-scenario calculator
- Paid tier ($9–15/mo or $79–149 one-time): full spousal/survivor optimization, tax + Medicare IRMAA layer, AI assistant, document reader, yearly re-check

**UI/UX**
- Fully custom, modern design system (not template-default) — see Section 8
- Onboarding flow with progress indication, micro-animations, and empathetic copy (this is a high-anxiety financial topic)

### 6.2 Phase 2 (Growth)

- **Advisor/B2B mode**: multi-client dashboard, white-label client-ready PDF reports, bulk rule-change alerts across a client book
- **Scenario simulator via natural language**: "What if I get laid off at 63?" / "What if benefits get cut 22%?"
- **Life-event triage flows**: divorce, widowhood, disability — guided AI conversation surfaces relevant benefit options
- **Roth conversion & RMD coordination** layer (tie Social Security timing to broader tax picture)
- **Retirement "second opinion" PDF generator** — polished report as a paid one-time add-on, shareable with a human advisor

### 6.3 Phase 3 (Moat-widening / Clever differentiators)

- **"What if Congress acts" scenario modeling** — lets users toggle between current-law, 2032-depletion-cut, and proposed-reform scenarios side by side (directly addresses the #1 anxiety driver in this space)
- **State tax residency comparison** — "how would moving to Florida vs staying in California change my after-tax retirement income"
- **Household dashboard** — for couples, one shared view instead of two separate accounts
- **Voice mode** for the AI assistant (accessibility win for older users)
- **API/embeddable widget** — license the calculator engine to fee-only advisor websites (new B2B revenue line)
- **Annual "State of Your Plan" auto-generated report** — a yearly, personalized recap email/PDF, great retention + referral driver

---

## 7. AI Feature Architecture (Summary)

| Feature | AI role | Grounding requirement |
|---|---|---|
| Chat assistant | Conversational answers | Must be grounded in user's saved profile data + current SSA/IRS rules; no hallucinated figures |
| Document reader | Summarization/extraction | OCR + LLM summarization of uploaded letters |
| Rule-change impact summaries | Personalized generation | Pulled from monitored government sources, paired with user profile, human-reviewed before wide release (at least early on) |
| Scenario simulator | Natural-language → structured calculation | NL input mapped to deterministic calculation engine — **AI explains results, but the underlying math must be deterministic and auditable, not LLM-generated numbers** |
| OCR intake | Extraction | Image → structured data (birth date, earnings) with user confirmation step before saving |

**Critical design principle:** The AI layer explains and personalizes; it never independently invents the underlying financial calculations. All benefit math runs through a deterministic, testable calculation engine (based on published SSA formulas). This keeps the product accurate, auditable, and defensible.

---

## 8. UI/UX Requirements (High Priority)

This is a trust-and-money product competing against outdated-looking incumbents — visual polish is a core differentiator, not decoration.

**Design principles:**
- Custom design system — distinctive typography, color palette, and spacing; **not** a generic Bootstrap/Tailwind-default look
- Calm, confidence-inspiring visual tone (this is an anxiety-adjacent topic — avoid alarming reds/aggressive colors except for genuine warnings)
- Meaningful micro-animations: number count-ups on benefit estimates, smooth chart transitions when comparing claiming ages, satisfying progress indicators during onboarding
- Data visualization as a first-class citizen: interactive lifetime-benefit charts, breakeven-age sliders, side-by-side scenario comparison cards
- Mobile-first responsive layout, dark mode support
- Accessibility: large-text mode and high-contrast option given the older target demographic
- Empty/loading states designed with the same care as populated states (no generic spinners — use the AI "load messages" pattern for perceived intelligence)

**Explicit anti-goal:** avoid the "obviously AI-generated" look — no default unstyled form inputs, no stock-template card grids, no lorem-ipsum-feeling copy. Every screen should look like it belongs to a funded fintech product (Mint, Copilot Money, Monarch tier of polish).

---

## 9. Technical Architecture (High-Level)

- **Frontend:** React (web-first, responsive), custom design system/component library
- **Backend:** API-driven; deterministic Social Security/benefit calculation engine as its own service (testable, versioned against published SSA bend-point/COLA data each year)
- **AI layer:** Claude API for chat assistant, document summarization, and personalized notification generation — always passed the user's structured profile data as grounding context
- **Data pipeline:** Scheduled scraper/RSS watcher on SSA.gov, IRS.gov, CMS.gov → triggers AI-generated draft summaries → human review queue (early on) → push to affected user segments
- **Data security:** Encryption at rest and in transit for PII (birth dates, earnings history, SSNs if ever collected — strongly prefer NOT collecting SSNs at all, use estimated PIA instead)
- **Auth:** Standard secure auth (OAuth/email), no unnecessary data retention beyond what the product needs

---

## 10. Legal & Compliance Considerations

- Prominent, persistent disclaimer: **"Informational and educational only — not financial, legal, or tax advice."**
- UX language must stay in "here's what the scenarios show" territory, not "you should do X" — avoids directive advice framing that could imply unlicensed financial advisory services
- Do not require or store Social Security Numbers if avoidable — use self-reported/estimated PIA or SSA statement upload instead
- Recommend legal review before launch, and again before any advisor-facing (B2B) product, since that market has more regulatory exposure
- Data privacy compliance (state privacy laws, e.g., CCPA) given sensitive financial data collected

---

## 11. Success Metrics

| Metric | Target (12 months) |
|---|---|
| MRR | $10,000+ |
| Consumer paid conversion rate (free → paid) | 3–6% |
| Monthly active retention (paid users) | 40%+ returning monthly |
| Advisor seats (if pursued) | 60–100 seats @ $100–150/mo |
| AI assistant engagement | 50%+ of paid users use it monthly |
| NPS | 40+ |

---

## 12. Open Questions for Next Phase (to resolve before build)

1. Web-first vs. native app for v1?
2. Direct-to-consumer launch first, or advisor B2B first (different sales motions)?
3. Pricing: subscription vs. one-time vs. hybrid — needs light market validation
4. How much human review is required on AI-generated rule-change summaries before full automation is trusted?
5. Legal consultation scope/cost before opening paid signups

---

*End of PRD v1.0 — ready for technical breakdown into epics/sprints once reviewed.*
