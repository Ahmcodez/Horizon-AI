/**
 * Curated general-interest SSA / CMS / Medicare policy news.
 *
 * This is NOT the personalized per-user alert feed (see lib/alerts.ts, backed by the
 * functions/src daily scraper). This is a small, manually-curated reference list of
 * confirmed past changes and known upcoming dates, meant to give every visitor useful
 * context even before the personalized scraper has produced anything for their account.
 *
 * Sourced from SSA.gov, CMS.gov, and the 2026 Social Security & Medicare Trustees Report.
 * Last verified: August 2026. Re-verify and refresh periodically — this list does not
 * update itself.
 */

export interface PolicyNewsItem {
  id: string
  date: string // human-readable, e.g. "Oct 2025" or "Expected Oct 2026"
  category: 'recent' | 'upcoming'
  title: string
  description: string
  source: string
  sourceUrl: string
}

export const POLICY_NEWS: PolicyNewsItem[] = [
  {
    id: 'cola-2026',
    date: 'Oct 2025',
    category: 'recent',
    title: '2026 COLA set at 2.8%',
    description:
      'Social Security and SSI payments increased 2.8% starting with January 2026 benefits, raising the average retirement benefit by roughly $56/month.',
    source: 'SSA',
    sourceUrl: 'https://www.ssa.gov/news/en/cola/index.html',
  },
  {
    id: 'earnings-limits-2026',
    date: 'Oct 2025',
    category: 'recent',
    title: '2026 earnings-test limits and taxable maximum increased',
    description:
      'For 2026, the taxable maximum rose to $184,500. The earnings limit for those under full retirement age rose to $24,480/year; for those reaching FRA in 2026, it rose to $65,160/year.',
    source: 'SSA',
    sourceUrl: 'https://www.ssa.gov/news/en/cola/factsheets/2026.html',
  },
  {
    id: 'medicare-partb-2026',
    date: 'Nov 2025',
    category: 'recent',
    title: 'Medicare Part B premium jumped nearly 10% for 2026',
    description:
      'The standard monthly Part B premium rose from $185 to $202.90, and the annual deductible rose from $257 to $283 — one of the larger year-over-year increases in the program\'s history.',
    source: 'CMS',
    sourceUrl: 'https://www.federalregister.gov/documents/2025/11/19/2025-20251/medicare-program-medicare-part-b-monthly-actuarial-rates-premium-rates-and-annual-deductible',
  },
  {
    id: 'trustees-2026',
    date: 'Jun 2026',
    category: 'recent',
    title: '2026 Trustees Report: OASI depletion moved up to late 2032',
    description:
      'The retirement trust fund (OASI) is now projected to deplete in Q4 2032, about 78% of scheduled benefits payable after that unless Congress acts. Combined with disability insurance, the depletion date holds at 2034 (83% payable).',
    source: 'SSA Office of the Chief Actuary',
    sourceUrl: 'https://www.ssa.gov/oact/trsum/',
  },
  {
    id: 'wep-gpo-status-2026',
    date: 'Ongoing into 2026',
    category: 'recent',
    title: 'WEP/GPO repeal mostly complete — some back-pay disputes remain',
    description:
      'The Social Security Fairness Act repealed WEP and GPO retroactive to Jan 2024. SSA finished most retroactive payments by mid-2025, but a group of senators is pushing back on how SSA is limiting back pay for people who never filed a claim while GPO was in effect.',
    source: 'SSA / Congressional correspondence',
    sourceUrl: 'https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html',
  },
  {
    id: 'cola-2027-expected',
    date: 'Expected Oct 2026',
    category: 'upcoming',
    title: '2027 COLA announcement',
    description:
      'SSA typically announces the next year\'s cost-of-living adjustment in mid-October, based on Q3 CPI-W inflation data. This will also set the 2027 taxable maximum and earnings-test limits.',
    source: 'SSA (expected)',
    sourceUrl: 'https://www.ssa.gov/news/en/cola/index.html',
  },
  {
    id: 'partb-2027-expected',
    date: 'Expected Nov 2026',
    category: 'upcoming',
    title: '2027 Medicare Part B premium announcement',
    description:
      'CMS typically announces the following year\'s Part B premium and deductible in mid-to-late November. Given 2026\'s roughly 10% jump, next year\'s figure is worth watching closely.',
    source: 'CMS (expected)',
    sourceUrl: 'https://www.cms.gov',
  },
  {
    id: 'oasi-depletion-watch',
    date: 'Q4 2032 (projected)',
    category: 'upcoming',
    title: 'OASI trust fund reserve depletion, if Congress doesn\'t act',
    description:
      'This is the date behind Horizon\'s benefit-cut scenario modeling — a real, published projection, not a doomsday prediction. Congress could still change the underlying law before then, as it has multiple times in the program\'s history.',
    source: 'SSA Office of the Chief Actuary',
    sourceUrl: 'https://www.ssa.gov/oact/trsum/',
  },
]
