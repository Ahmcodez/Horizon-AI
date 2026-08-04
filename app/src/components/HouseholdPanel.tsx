import { useMemo, useState } from 'react'
import {
  getFullRetirementAge,
  calculateSpousalBenefit,
  calculateSurvivorBenefit,
  calculateMonthlyBenefit,
  getPensionOffsetStatus,
  calculateEarningsWithholding,
  ageToMonths,
} from '../lib/socialSecurity'

type Tab = 'spousal' | 'survivor' | 'pension' | 'working'

const TABS: { id: Tab; label: string }[] = [
  { id: 'spousal', label: 'Spousal benefit' },
  { id: 'survivor', label: 'Survivor benefit' },
  { id: 'pension', label: 'Public pension (WEP/GPO)' },
  { id: 'working', label: 'Working while claiming' },
]

interface Props {
  primaryPia: number
  primaryBirthYear: number
}

export default function HouseholdPanel({ primaryPia, primaryBirthYear }: Props) {
  const [tab, setTab] = useState<Tab>('spousal')

  return (
    <div className="bg-graphite-veil/25 border border-ash-border rounded-[15px] p-8" style={{ fontFamily: 'var(--font-vivid)' }}>
      <h2 className="text-xl font-normal mb-1 text-bone-white">Household &amp; work situation</h2>
      <p className="text-sm text-bone-white/60 mb-6">
        Spousal and survivor coordination, public-pension status, and working while claiming —
        each of these can change your real number.
      </p>

      <div className="flex flex-wrap gap-2 mb-7">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-[9999px] text-sm transition-colors duration-500 border ${
              tab === t.id
                ? 'bg-bone-white text-vivid-obsidian border-bone-white'
                : 'bg-transparent text-fog-blue border-ash-border hover:text-bone-white'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'spousal' && <SpousalTab primaryPia={primaryPia} primaryBirthYear={primaryBirthYear} />}
      {tab === 'survivor' && <SurvivorTab primaryBirthYear={primaryBirthYear} />}
      {tab === 'pension' && <PensionTab />}
      {tab === 'working' && <WorkingTab primaryPia={primaryPia} primaryBirthYear={primaryBirthYear} />}
    </div>
  )
}

function SpousalTab({ primaryPia, primaryBirthYear }: Props) {
  const [spouseBirthYear, setSpouseBirthYear] = useState(1966)
  const [spouseClaimAge, setSpouseClaimAge] = useState(67)
  const [spouseOwnPia, setSpouseOwnPia] = useState(900)

  const spouseFra = useMemo(() => getFullRetirementAge(spouseBirthYear), [spouseBirthYear])
  const spousalFromPrimary = useMemo(
    () => calculateSpousalBenefit(primaryPia, spouseFra, ageToMonths(spouseClaimAge)),
    [primaryPia, spouseFra, spouseClaimAge]
  )
  const spouseOwnBenefit = useMemo(
    () => calculateMonthlyBenefit(spouseOwnPia, spouseFra, ageToMonths(spouseClaimAge)),
    [spouseOwnPia, spouseFra, spouseClaimAge]
  )

  const finalBenefit = Math.max(spousalFromPrimary, spouseOwnBenefit)
  const source = spousalFromPrimary > spouseOwnBenefit ? 'spousal' : 'own record'

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-5">
        <FieldNumber label="Spouse's birth year" value={spouseBirthYear} onChange={setSpouseBirthYear} min={1943} max={1970} />
        <FieldNumber label="Spouse's own PIA (if any)" value={spouseOwnPia} onChange={setSpouseOwnPia} prefix="$" step={50} />
        <div>
          <span className="text-sm text-bone-white block mb-2">
            Spouse claims at age <span className="text-bone-white">{spouseClaimAge}</span>
          </span>
          <input
            type="range"
            min={62}
            max={70}
            value={spouseClaimAge}
            onChange={(e) => setSpouseClaimAge(Number(e.target.value))}
            className="w-full accent-bone-white"
          />
        </div>
      </div>

      <div className="bg-graphite-veil/45 border border-ash-border rounded-[15px] p-6">
        <div className="text-xs uppercase tracking-[0.02em] text-fog-blue mb-3">Result</div>
        <div className="text-3xl font-normal mb-1 text-bone-white">
          ${finalBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="text-base text-bone-white/50 font-normal">/mo</span>
        </div>
        <div className="text-sm text-bone-white/60 mb-4">
          Paid from {source === 'spousal' ? "the spousal benefit (based on your record)" : "the spouse's own work record"}
        </div>
        <div className="space-y-2 text-sm border-t border-ash-border pt-4">
          <div className="flex justify-between">
            <span className="text-fog-blue">Spousal benefit (up to 50% of your PIA)</span>
            <span className="text-bone-white">${spousalFromPrimary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fog-blue">Spouse's own benefit</span>
            <span className="text-bone-white">${spouseOwnBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <p className="text-xs text-fog-blue mt-4 leading-relaxed">
          Social Security automatically pays whichever is higher — never both added together.
        </p>
      </div>
    </div>
  )
}

function SurvivorTab({ primaryBirthYear }: Pick<Props, 'primaryBirthYear'>) {
  const [deceasedPia, setDeceasedPia] = useState(2400)
  const [survivorClaimAge, setSurvivorClaimAge] = useState(60)

  const survivorFra = useMemo(() => getFullRetirementAge(primaryBirthYear), [primaryBirthYear])
  const survivorBenefit = useMemo(
    () =>
      calculateSurvivorBenefit({
        deceasedPia,
        deceasedClaimedEarly: false,
        survivorFra,
        survivorClaimAgeMonths: ageToMonths(survivorClaimAge),
      }),
    [deceasedPia, survivorFra, survivorClaimAge]
  )

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-5">
        <FieldNumber label="Deceased spouse's PIA" value={deceasedPia} onChange={setDeceasedPia} prefix="$" step={50} />
        <div>
          <span className="text-sm text-bone-white block mb-2">
            You claim survivor benefit at age <span className="text-bone-white">{survivorClaimAge}</span>
          </span>
          <input
            type="range"
            min={60}
            max={survivorFra.years}
            value={survivorClaimAge}
            onChange={(e) => setSurvivorClaimAge(Number(e.target.value))}
            className="w-full accent-bone-white"
          />
          <div className="flex justify-between text-xs text-fog-blue mt-1">
            <span>60 (earliest)</span>
            <span>{survivorFra.years} (full)</span>
          </div>
        </div>
      </div>

      <div className="bg-graphite-veil/45 border border-ash-border rounded-[15px] p-6">
        <div className="text-xs uppercase tracking-[0.02em] text-fog-blue mb-3">Result</div>
        <div className="text-3xl font-normal mb-1 text-bone-white">
          ${survivorBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="text-base text-bone-white/50 font-normal">/mo</span>
        </div>
        <div className="text-sm text-bone-white/60">
          {survivorClaimAge >= survivorFra.years
            ? 'Full survivor benefit — you\'ve reached your own full retirement age.'
            : `Reduced for claiming ${survivorFra.years - survivorClaimAge} year(s) before your full retirement age.`}
        </div>
        <p className="text-xs text-fog-blue mt-4 leading-relaxed">
          Survivor benefits can start as early as age 60 — seven years before retirement benefits
          become available — which makes them an important safety net, not just a reduced-rate
          version of a retirement claim.
        </p>
      </div>
    </div>
  )
}

function PensionTab() {
  const [hasPension, setHasPension] = useState<boolean | null>(null)
  const status = hasPension === null ? null : getPensionOffsetStatus(hasPension)

  return (
    <div className="max-w-xl">
      <p className="text-sm text-bone-white mb-5">
        Did you (or will you) receive a pension from work not covered by Social Security — for
        example, many teacher, firefighter, or police pensions?
      </p>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setHasPension(true)}
          className={`px-5 py-2.5 rounded-[9999px] text-sm border transition-colors duration-500 ${
            hasPension === true ? 'bg-bone-white text-vivid-obsidian border-bone-white' : 'bg-transparent border-ash-border text-fog-blue'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
        >
          Yes
        </button>
        <button
          onClick={() => setHasPension(false)}
          className={`px-5 py-2.5 rounded-[9999px] text-sm border transition-colors duration-500 ${
            hasPension === false ? 'bg-bone-white text-vivid-obsidian border-bone-white' : 'bg-transparent border-ash-border text-fog-blue'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.52,0.01,0,1)' }}
        >
          No
        </button>
      </div>

      {status && (
        <div className="rounded-[15px] p-6 bg-graphite-veil/30 border border-ash-border">
          <div className="text-xs uppercase tracking-[0.02em] text-fog-blue mb-2">
            {hasPension ? 'Good news' : 'Not applicable'}
          </div>
          <p className="text-sm text-bone-white leading-relaxed">{status.message}</p>
        </div>
      )}
    </div>
  )
}

function WorkingTab({ primaryPia, primaryBirthYear }: Props) {
  const [claimAge, setClaimAge] = useState(63)
  const [annualEarnings, setAnnualEarnings] = useState(20000)

  const fra = useMemo(() => getFullRetirementAge(primaryBirthYear), [primaryBirthYear])
  const isYearOfFra = claimAge === fra.years
  const beforeFra = claimAge < fra.years

  const monthlyBenefit = useMemo(
    () => calculateMonthlyBenefit(primaryPia, fra, ageToMonths(claimAge)),
    [primaryPia, fra, claimAge]
  )
  const annualBenefit = monthlyBenefit * 12
  const withholding = useMemo(
    () => (beforeFra ? calculateEarningsWithholding(annualEarnings, isYearOfFra) : 0),
    [annualEarnings, beforeFra, isYearOfFra]
  )
  const netAnnual = Math.max(annualBenefit - withholding, 0)

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-5">
        <div>
          <span className="text-sm text-bone-white block mb-2">
            You claim at age <span className="text-bone-white">{claimAge}</span>
          </span>
          <input
            type="range"
            min={62}
            max={70}
            value={claimAge}
            onChange={(e) => setClaimAge(Number(e.target.value))}
            className="w-full accent-bone-white"
          />
        </div>
        <FieldNumber
          label="Expected annual earnings while claiming"
          value={annualEarnings}
          onChange={setAnnualEarnings}
          prefix="$"
          step={1000}
        />
        {!beforeFra && (
          <p className="text-xs text-fog-blue bg-graphite-veil/30 border border-ash-border rounded-[5px] p-3">
            You're claiming at or after full retirement age — the earnings test no longer applies.
            You can earn any amount with no withholding.
          </p>
        )}
      </div>

      <div className="bg-graphite-veil/45 border border-ash-border rounded-[15px] p-6">
        <div className="text-xs uppercase tracking-[0.02em] text-fog-blue mb-3">Result</div>
        <div className="text-3xl font-normal mb-1 text-bone-white">
          ${netAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="text-base text-bone-white/50 font-normal">/yr net</span>
        </div>
        <div className="space-y-2 text-sm border-t border-ash-border pt-4 mt-4">
          <div className="flex justify-between">
            <span className="text-fog-blue">Gross annual benefit</span>
            <span className="text-bone-white">${annualBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fog-blue">Withheld for earnings over the limit</span>
            <span className="text-prism-red">
              {withholding > 0 ? `-$${withholding.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0'}
            </span>
          </div>
        </div>
        <p className="text-xs text-fog-blue mt-4 leading-relaxed">
          Withheld amounts aren't lost forever — SSA recalculates your benefit upward once you
          reach full retirement age to credit back the months that were withheld.
        </p>
      </div>
    </div>
  )
}

function FieldNumber({
  label,
  value,
  onChange,
  prefix,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  prefix?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label className="block">
      <span className="text-sm text-bone-white block mb-2">{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fog-blue">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full bg-vivid-obsidian border border-ash-border rounded-[5px] py-3 text-base focus:border-bone-white outline-none transition-colors text-bone-white ${
            prefix ? 'pl-8 pr-4' : 'px-4'
          }`}
        />
      </div>
    </label>
  )
}
