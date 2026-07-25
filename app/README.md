# Horizon — Social Security Planner

**Phase 2 deliverable:** real React project scaffold + deterministic Social
Security calculation engine + interactive results UI.

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS v4 (design tokens defined in `src/index.css` under `@theme`,
  ported 1:1 from the approved Phase 1 mockups — same colors, fonts, shadows)
- Recharts for the benefit comparison chart
- React Router (single route for now — landing page port is a later phase)

## Getting started
```bash
npm install
npm run dev
```
Then open the printed local URL (defaults to http://localhost:5173).

To type-check and build for production:
```bash
npm run build
```

## Project structure
```
src/
  lib/
    socialSecurity.ts     ← the calculation engine (pure functions, no UI, no AI)
  components/
    Navbar.tsx
    BenefitChart.tsx
  pages/
    CalculatorPage.tsx    ← the Phase 2 core screen
  index.css               ← Tailwind v4 theme tokens (design system lives here)
```

## About the calculation engine
`src/lib/socialSecurity.ts` is intentionally isolated from the rest of the
app — it has no React, no network calls, no AI. Given a Primary Insurance
Amount (PIA, the "benefit at full retirement age" figure from an SSA
statement) and a birth year, it computes:

- Full retirement age (SSA's official table)
- Monthly benefit at any claiming age 62–70, using SSA's real reduction/credit
  formulas (5/9 of 1% per month early for the first 36 months, 5/12 of 1%
  beyond that; 2/3 of 1% per month delayed)
- Breakeven age between two claiming strategies
- A simplified spousal benefit calculation
- 2026 earnings-test withholding

These were spot-checked against known SSA reference figures (e.g. a 30%
reduction at 62 and a 24% increase at 70 for someone with FRA 67) and matched
exactly.

**Scope note:** this takes PIA as an input rather than deriving it from a full
35-year earnings history via the AIME/bend-point formula — the same number
already printed on every SSA statement, and it's what unlocks the "photograph
your SSA statement" intake flow from the PRD. Full from-scratch AIME
calculation is a reasonable Phase 3+ enhancement.

## What's NOT in this phase yet
- Landing page (still the standalone HTML file from Phase 1 — porting it to
  React is a fast follow, not blocking)
- Spousal/survivor UI (engine function exists, no screen yet)
- Accounts, persistence, AI assistant, document reader, monetization

## Disclaimer
Informational estimates only. Not financial, legal, or tax advice. Not
affiliated with or endorsed by the Social Security Administration.
