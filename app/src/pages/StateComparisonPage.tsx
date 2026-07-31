import { useState } from 'react'
import { getStateTaxInfo, ALL_STATE_CODES, type StateTaxInfo } from '../lib/stateTax'
import UpgradeGate from '../components/UpgradeGate'

export default function StateComparisonPage() {
  const [stateA, setStateA] = useState('CA')
  const [stateB, setStateB] = useState('FL')

  const infoA = getStateTaxInfo(stateA)
  const infoB = getStateTaxInfo(stateB)

  return (
    <main
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="max-w-4xl mx-auto px-8 pt-32 pb-24 bg-paper-dim min-h-screen"
    >
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-emerald font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-emerald" />
          State comparison
        </div>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-ink">
          Does your state tax Social Security?
        </h1>
        <p className="mt-4 text-muted text-lg leading-relaxed">
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

        <p className="text-xs text-muted leading-relaxed mt-8">
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
      <span className="text-sm font-medium text-ink block mb-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 focus:border-gold outline-none text-ink"
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
      className={`rounded-3xl p-7 border ${
        info.taxesSocialSecurity
          ? 'bg-red-50 border-red-200'
          : 'bg-paper border-ink/8 shadow-card-light'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-ink">{info.name}</h2>
        <span
          className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full ${
            info.taxesSocialSecurity ? 'bg-red-500 text-white' : 'bg-emerald text-obsidian'
          }`}
        >
          {info.taxesSocialSecurity ? 'Taxes SS' : 'No SS tax'}
        </span>
      </div>
      <p className="text-sm text-ink/80 leading-relaxed">{info.notes}</p>
    </div>
  )
}
