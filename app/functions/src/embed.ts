import { onRequest } from 'firebase-functions/v2/https';

/**
 * Horizon — embeddable widget backend
 * --------------------------------------
 * Unlike every other function in this app, this one is intentionally
 * PUBLIC and unauthenticated - it's meant to be called from a <script>
 * embed on a third-party advisor's website, where there's no Firebase
 * Auth session to check.
 *
 * Because of that, it must never touch anything sensitive:
 *  - No Firestore reads/writes, no user data, no API keys.
 *  - Pure math only, reusing the exact same deterministic formulas as the
 *    main app's calculation engine (duplicated here rather than imported,
 *    since this function ships independently and shouldn't depend on the
 *    rest of the app's build).
 *  - Strict input validation and a hard cap on realistic input ranges, both
 *    to fail predictably and to avoid this becoming an abuse vector.
 */

interface FullRetirementAge {
  years: number;
  months: number;
  totalMonths: number;
}

function getFullRetirementAge(birthYear: number): FullRetirementAge {
  const table: Record<number, [number, number]> = {
    1943: [66, 0], 1944: [66, 0], 1945: [66, 0], 1946: [66, 0], 1947: [66, 0],
    1948: [66, 0], 1949: [66, 0], 1950: [66, 0], 1951: [66, 0], 1952: [66, 0],
    1953: [66, 0], 1954: [66, 0],
    1955: [66, 2], 1956: [66, 4], 1957: [66, 6], 1958: [66, 8], 1959: [66, 10],
  };
  if (birthYear >= 1960) return { years: 67, months: 0, totalMonths: 67 * 12 };
  if (birthYear <= 1942) return { years: 65, months: 0, totalMonths: 65 * 12 };
  const [y, m] = table[birthYear] ?? [67, 0];
  return { years: y, months: m, totalMonths: y * 12 + m };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calculateMonthlyBenefit(pia: number, fra: FullRetirementAge, claimAgeMonths: number): number {
  const clamped = Math.min(Math.max(claimAgeMonths, 62 * 12), 70 * 12);
  if (clamped < fra.totalMonths) {
    const monthsEarly = fra.totalMonths - clamped;
    const first36 = Math.min(monthsEarly, 36);
    const beyond36 = Math.max(monthsEarly - 36, 0);
    const reductionPct = first36 * (5 / 9) + beyond36 * (5 / 12);
    return round2(pia * (1 - reductionPct / 100));
  }
  if (clamped > fra.totalMonths) {
    const monthsDelayed = clamped - fra.totalMonths;
    const increasePct = monthsDelayed * (2 / 3);
    return round2(pia * (1 + increasePct / 100));
  }
  return round2(pia);
}

interface EmbedCalculateRequest {
  pia: number;
  birthYear: number;
}

function validateInput(data: any): { pia: number; birthYear: number } | null {
  const pia = Number(data?.pia);
  const birthYear = Number(data?.birthYear);
  if (!Number.isFinite(pia) || pia <= 0 || pia > 10000) return null; // $10k/mo PIA is far beyond any real benefit - sanity cap
  if (!Number.isFinite(birthYear) || birthYear < 1930 || birthYear > 2010) return null;
  return { pia, birthYear };
}

/**
 * CORS-open HTTP endpoint for the embed script. No auth, no Firestore -
 * pure calculation, same shape as generateClaimingComparison() in the main
 * app's engine.
 */
export const embedCalculate = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const input = validateInput(req.body);
  if (!input) {
    res.status(400).json({ error: 'Provide a valid pia (0-10000) and birthYear (1930-2010).' });
    return;
  }

  const fra = getFullRetirementAge(input.birthYear);
  const ages = [62, 63, 64, 65, 66, 67, 68, 69, 70];
  const comparison = ages.map((age) => {
    const monthly = calculateMonthlyBenefit(input.pia, fra, age * 12);
    return { age, monthlyBenefit: monthly, annualBenefit: round2(monthly * 12) };
  });

  res.status(200).json({
    fullRetirementAge: { years: fra.years, months: fra.months },
    comparison,
    poweredBy: 'Horizon (horizon.com) — informational only, not financial advice',
  });
});
