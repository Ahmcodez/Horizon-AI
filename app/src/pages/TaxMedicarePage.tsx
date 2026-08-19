import { useEffect, useState } from 'react'
import UpgradeGate from '../components/UpgradeGate'
import { useReveal } from '../lib/useReveal'
import { getRmdStartAge, calculateRmd, type RmdResult } from '../lib/rmd'
import { calculateTaxableSsBenefits, type FilingStatus, type SsTaxResult } from '../lib/socialSecurityTax'
import { calculateIrmaa, type IrmaaFilingStatus, type IrmaaResult } from '../lib/irmaa'

export default function TaxMedicarePage() {
  useEffect(() => {
    document.title = 'Tax & Medicare — RMDs, SS Taxation & IRMAA | MyClaimAge'
  }, [])

  const reveal = useReveal<HTMLDivElement>()

  return (
    <main
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-5xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-fog-blue" />
          Tax &amp; Medicare
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white max-w-2xl">
          What retirement income actually costs you.
        </h1>
        <p className="mt-4 text-fog-blue text-lg leading-relaxed max-w-2xl">
          Three real, published federal formulas — required withdrawals from retirement accounts,
          how much of your Social Security gets taxed, and what Medicare charges high earners.
          Each one is a deterministic calculation, not an estimate: same inputs always produce the
          same government-published answer.
        </p>
      </div>

      <UpgradeGate feature="Tax & Medicare calculators">
        <div ref={reveal} className="reveal space-y-8">
          <RmdCard />
          <SsTaxCard />
          <IrmaaCard />
        </div>

        <p className="text-xs text-fog-blue leading-relaxed mt-8 max-w-2xl">
          Informational only — not tax or financial advice. These calculators implement the
          published IRS Uniform Lifetime Table, IRS Publication 915 Worksheet 1, and CMS's 2026
          IRMAA brackets exactly as written, but don't cover every situation (IRA-deduction
          interactions, lump-sum elections, nonresident alien rules, and joint/inherited-account
          RMD tables are out of scope). Confirm with a tax professional before filing.
        </p>
      </UpgradeGate>
    </main>
  )
}

function RmdCard() {
  const [balance, setBalance] = useState(500000)
  const [birthYear, setBirthYear] = useState(1955)
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear
  const startAge = getRmdStartAge(birthYear)
  const result: RmdResult | null = calculateRmd(balance, age)

  return (
    <div className="hover-glow-white bg-graphite-veil/20 border border-ash-border rounded-[15px] p-8">
      <h2 className="text-xl font-normal mb-1 text-bone-white">Required Minimum Distribution</h2>
      <p className="text-sm text-fog-blue mb-6 max-w-2xl">
        Once you reach {startAge} (your RMD start age under SECURE 2.0), the IRS requires a
        minimum annual withdrawal from traditional IRAs/401(k)s, based on your account balance and
        the IRS Uniform Lifetime Table.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">
            Account balance (Dec 31 prior year)
          </span>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
          />
        </label>
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">Birth year</span>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(Number(e.target.value))}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
          />
        </label>
      </div>

      {result ? (
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Your age this year" value={`${age}`} />
          <Stat label="Table divisor" value={`${result.divisor}`} />
          <Stat label="Required withdrawal" value={`$${result.rmdAmount.toLocaleString()}`} emphasize />
        </div>
      ) : (
        <p className="text-sm text-fog-blue">
          No RMD required yet — this account's RMDs begin at age {startAge} (you're currently {age}).
        </p>
      )}
    </div>
  )
}

function SsTaxCard() {
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single')
  const [netBenefits, setNetBenefits] = useState(24000)
  const [otherIncome, setOtherIncome] = useState(20000)
  const [taxExemptInterest, setTaxExemptInterest] = useState(0)
  const [livedWithSpouse, setLivedWithSpouse] = useState(false)

  const result: SsTaxResult = calculateTaxableSsBenefits({
    filingStatus,
    netBenefits,
    otherTaxableIncome: otherIncome,
    taxExemptInterest,
    livedWithSpouseIfMFS: livedWithSpouse,
  })

  return (
    <div className="hover-glow-white bg-graphite-veil/20 border border-ash-border rounded-[15px] p-8">
      <h2 className="text-xl font-normal mb-1 text-bone-white">How much of your Social Security is taxed</h2>
      <p className="text-sm text-fog-blue mb-6 max-w-2xl">
        The federal thresholds ($25,000 single / $32,000 joint) have never been adjusted for
        inflation since 1983 and 1993 — this runs the actual IRS worksheet against your numbers.
      </p>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">Filing status</span>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 focus:border-bone-white outline-none text-bone-white"
          >
            <option value="single">Single / head of household</option>
            <option value="marriedFilingJointly">Married filing jointly</option>
            <option value="marriedFilingSeparately">Married filing separately</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">Net Social Security benefits ($/yr)</span>
          <input
            type="number"
            value={netBenefits}
            onChange={(e) => setNetBenefits(Number(e.target.value))}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
          />
        </label>
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">Other taxable income ($/yr)</span>
          <input
            type="number"
            value={otherIncome}
            onChange={(e) => setOtherIncome(Number(e.target.value))}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
          />
        </label>
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">Tax-exempt interest ($/yr)</span>
          <input
            type="number"
            value={taxExemptInterest}
            onChange={(e) => setTaxExemptInterest(Number(e.target.value))}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
          />
        </label>
      </div>

      {filingStatus === 'marriedFilingSeparately' && (
        <label className="flex items-center gap-2 mb-6 text-sm text-bone-white">
          <input
            type="checkbox"
            checked={livedWithSpouse}
            onChange={(e) => setLivedWithSpouse(e.target.checked)}
            className="accent-bone-white"
          />
          Lived with spouse at any point this year
        </label>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Combined income" value={`$${result.combinedIncome.toLocaleString()}`} />
        <Stat label="% of benefits taxed" value={`${result.taxablePercent}%`} />
        <Stat label="Taxable amount" value={`$${result.taxableBenefits.toLocaleString()}`} emphasize />
      </div>
    </div>
  )
}

function IrmaaCard() {
  const [filingStatus, setFilingStatus] = useState<IrmaaFilingStatus>('single')
  const [magi, setMagi] = useState(90000)

  const result: IrmaaResult = calculateIrmaa(magi, filingStatus)

  return (
    <div className="hover-glow-white bg-graphite-veil/20 border border-ash-border rounded-[15px] p-8">
      <h2 className="text-xl font-normal mb-1 text-bone-white">Medicare IRMAA</h2>
      <p className="text-sm text-fog-blue mb-6 max-w-2xl">
        Uses a 2-year lookback — your 2026 premium is based on your 2024 MAGI. It's a cliff, not a
        phase-in: $1 over a threshold triggers the full next tier.
      </p>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">Filing status</span>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as IrmaaFilingStatus)}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 focus:border-bone-white outline-none text-bone-white"
          >
            <option value="single">Single</option>
            <option value="marriedFilingJointly">Married filing jointly</option>
            <option value="marriedFilingSeparately">Married filing separately (lived with spouse)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-normal text-bone-white/80 block mb-2">
            MAGI from 2 years ago ($)
          </span>
          <input
            type="number"
            value={magi}
            onChange={(e) => setMagi(Number(e.target.value))}
            className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Part B (total/mo)" value={`$${result.monthlyPartBTotal.toFixed(2)}`} />
        <Stat label="Part D surcharge/mo" value={`$${result.monthlyPartDSurcharge.toFixed(2)}`} />
        <Stat
          label="Extra cost per year"
          value={`$${result.annualTotalSurcharge.toLocaleString()}`}
          emphasize={result.annualTotalSurcharge > 0}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="bg-vivid-obsidian border border-ash-border rounded-[10px] p-4">
      <div className={`font-mono text-lg ${emphasize ? 'text-bone-white font-normal' : 'text-bone-white/80'}`}>
        {value}
      </div>
      <div className="text-xs text-fog-blue mt-1">{label}</div>
    </div>
  )
}
