import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ClaimingScenario } from '../lib/socialSecurity'

interface Props {
  data: ClaimingScenario[]
  highlightAge: number
  fraAge: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: ClaimingScenario = payload[0].payload
  return (
    <div
      className="bg-obsidian text-paper rounded-xl px-4 py-3 shadow-card-dark border border-obsidian-line"
      style={{ fontFamily: 'var(--font-luxe)' }}
    >
      <div className="font-mono text-xs text-gold mb-1">Age {d.age}</div>
      <div className="font-mono text-lg font-semibold">
        ${d.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
      </div>
      <div className="text-xs text-paper/60 mt-1">
        {d.vsFraPct > 0 ? '+' : ''}
        {d.vsFraPct}% vs. full retirement age
      </div>
    </div>
  )
}

export default function BenefitChart({ data, highlightAge, fraAge }: Props) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 8 }}>
          <XAxis
            dataKey="age"
            axisLine={false}
            tickLine={false}
            tick={{ fontFamily: 'Geist Mono', fontSize: 12, fill: '#8A8A93' }}
          />
          <YAxis hide domain={[0, 'dataMax + 300']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,183,0,0.08)' }} />
          <Bar dataKey="monthlyBenefit" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry) => {
              let fill = '#E9E9EC' // neutral default bar
              if (entry.age === highlightAge) fill = '#F5B700' // gold — user-selected age
              else if (entry.age === fraAge) fill = '#0A0A0C' // obsidian — FRA reference
              return <Cell key={entry.age} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
