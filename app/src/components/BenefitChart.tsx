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
      className="bg-lp-chalk text-lp-graphite rounded-[5px] px-4 py-3 border border-lp-line-strong"
      style={{ fontFamily: 'var(--font-jakarta)' }}
    >
      <div className="text-xs text-lp-slate mb-1">Age {d.age}</div>
      <div className="text-lg font-normal">
        ${d.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
      </div>
      <div className="text-xs text-lp-slate mt-1">
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
            tick={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, fill: '#64748B' }}
          />
          <YAxis hide domain={[0, 'dataMax + 300']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
          <Bar dataKey="monthlyBenefit" radius={[2, 2, 0, 0]} maxBarSize={56}>
            {data.map((entry) => {
              let fill = 'rgba(15,23,42,0.10)' // neutral default bar
              if (entry.age === highlightAge) fill = '#38BDF8' // new accent cyan — user-selected age
              else if (entry.age === fraAge) fill = '#64748B' // slate — FRA reference
              return <Cell key={entry.age} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
