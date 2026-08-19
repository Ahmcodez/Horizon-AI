import { useEffect, useState } from 'react'
import { getStateTaxInfo, ALL_STATE_CODES, type StateTaxInfo } from '../lib/stateTax'
import UpgradeGate from '../components/UpgradeGate'

export default function StateComparisonPage() {
  useEffect(() => {
    document.title = 'State Tax Comparison — Does Your State Tax Social Security? | MyClaimAge'
  }, [])

  const [stateA, setStateA] = useState('CA')
  const [stateB, setStateB] = useState('FL')

  const infoA = getStateTaxInfo(stateA)
  const infoB = getStateTaxInfo(stateB)

  return (
    <main
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-4xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-fog-blue" />
          State comparison
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white">
          Does your state tax Social Security?
        </h1>
        <p className="mt-4 text-fog-blue text-lg leading-relaxed">
          Compare how two states treat Social Security benefits specifically. This isn't a full
          relocation calculator — pensions, 401(k) withdrawals, property tax, and sales tax all
          matter too, and aren't covered here.
        </p>
      </div>

      <UpgradeGate feature="State tax comparison">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <StatePicker label="State A" value={stateA} onChange={setStateA} />
          <StatePicker label="State B" value={stateB} onChange={setStateB} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <StateCard key={infoA.code} info={infoA} />
          <StateCard key={infoB.code} info={infoB} />
        </div>

        <p className="text-xs text-fog-blue leading-relaxed mt-8">
          Informational only, based on published 2026 state tax rules — not tax advice. State tax
          law changes; confirm current thresholds with a tax professional or your state's revenue
          department before making a relocation decision. Many taxing states exempt most retirees
          through income-based deductions, so "taxes Social Security" doesn't always mean you'd
          actually owe anything.
        </p>
      </UpgradeGate>
    </main>
  )
}

function StatePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-normal text-bone-white/80 block mb-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 focus:border-bone-white outline-none text-bone-white"
      >
        {ALL_STATE_CODES.map((code) => (
          <option key={code} value={code}>
            {getStateTaxInfo(code).name}
          </option>
        ))}
      </select>
    </label>
  )
}

function StateCard({ info }: { info: StateTaxInfo }) {
  return (
    <div
      style={{ animation: 'fadeUp 0.35s cubic-bezier(.16,.8,.24,1)' }}
      className={`hover-glow-white rounded-[15px] p-7 border ${
        info.taxesSocialSecurity
          ? 'bg-graphite-veil/20 border-prism-red/40'
          : 'bg-graphite-veil/20 border-ash-border'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-normal text-bone-white">{info.name}</h2>
        <span
          className={`text-[11px] font-mono font-normal uppercase px-2.5 py-1 rounded-[5px] border ${
            info.taxesSocialSecurity ? 'border-prism-red text-prism-red' : 'border-prism-lime text-prism-lime'
          }`}
        >
          {info.taxesSocialSecurity ? 'Taxes SS' : 'No SS tax'}
        </span>
      </div>
      <p className="text-sm text-bone-white/70 leading-relaxed">{info.notes}</p>
    </div>
  )
}
