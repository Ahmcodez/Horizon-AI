/**
 * State-level tax treatment of Social Security benefits — 2026.
 *
 * SCOPE NOTE: this covers ONLY whether a state taxes Social Security
 * benefits specifically. It is not a full retirement-tax comparison —
 * it doesn't model pensions, 401(k)/IRA withdrawals, property tax, or
 * sales tax, all of which matter a lot for a real relocation decision.
 * Treat this as one input among several, not the whole picture.
 *
 * As of 2026, only 8 states still tax Social Security benefits in some
 * form: Colorado, Connecticut, Minnesota, Montana, New Mexico, Rhode
 * Island, Utah, and Vermont. West Virginia completed a phase-out and no
 * longer taxes benefits starting this tax year. The other 42 states plus
 * DC do not tax Social Security at all (nine of them - AK, FL, NV, NH,
 * SD, TN, TX, WA, WY - have no broad state income tax whatsoever).
 *
 * Every taxing state uses income-based exemptions or deductions, so many
 * retirees in these states owe little or nothing in practice - "taxes SS"
 * does not mean "taxes your SS." Where a specific 2026 threshold is well
 * documented, it's included; otherwise the description stays general
 * rather than stating an unverified precise figure.
 */

export interface StateTaxInfo {
  code: string;
  name: string;
  taxesSocialSecurity: boolean;
  hasNoIncomeTax: boolean; // true for the 9 states with no broad income tax at all
  notes: string;
}

const NO_INCOME_TAX_STATES = new Set(['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']);

const TAXING_STATE_NOTES: Record<string, string> = {
  CO: 'Colorado taxes Social Security, but residents 65+ can deduct all federally taxed benefits from state taxable income - most retirees 65 and older owe nothing. Under-65 filers have a more limited deduction.',
  CT: 'Connecticut exempts Social Security entirely for single filers with AGI under $75,000 and joint filers under $100,000. Above those thresholds, a portion becomes taxable, capped below the full federal amount.',
  MN: 'Minnesota exempts Social Security for most retirees - full exemption applies up to roughly $86,000 AGI (single) or $111,000 (joint) for 2026. Higher earners are taxed on a portion.',
  MT: 'Montana taxes Social Security with deductions available depending on age and income - exact treatment varies more than other taxing states, so check current Montana Department of Revenue guidance for your situation.',
  NM: 'New Mexico exempts Social Security for retirees under state-set income thresholds, with higher earners owing tax on a portion. Thresholds are adjusted periodically - verify the current figure before relying on it.',
  RI: 'Rhode Island exempts Social Security below an income threshold that adjusts for inflation each year; benefits above that threshold become partially taxable.',
  UT: "Utah significantly expanded its exemption in 2026 - retirees with adjusted income under about $54,000 (single) or $90,000 (joint) now owe no state tax on Social Security at all.",
  VT: 'Vermont exempts Social Security for single filers under $50,000 and joint filers under $65,000 in income; taxation phases in gradually above those levels.',
};

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export const ALL_STATE_CODES = Object.keys(STATE_NAMES).sort();

export function getStateTaxInfo(code: string): StateTaxInfo {
  const upperCode = code.toUpperCase();
  const taxes = upperCode in TAXING_STATE_NOTES;
  const noIncomeTax = NO_INCOME_TAX_STATES.has(upperCode);

  let notes: string;
  if (taxes) {
    notes = TAXING_STATE_NOTES[upperCode];
  } else if (noIncomeTax) {
    notes = `${STATE_NAMES[upperCode]} has no broad state income tax at all - Social Security and all other retirement income are state-tax-free.`;
  } else if (upperCode === 'WV') {
    notes = 'West Virginia completed a phase-out of its Social Security tax - as of the 2026 tax year, benefits are fully exempt.';
  } else {
    notes = `${STATE_NAMES[upperCode] ?? upperCode} does not tax Social Security benefits, though it does tax other income at its standard state rates.`;
  }

  return {
    code: upperCode,
    name: STATE_NAMES[upperCode] ?? upperCode,
    taxesSocialSecurity: taxes,
    hasNoIncomeTax: noIncomeTax,
    notes,
  };
}
