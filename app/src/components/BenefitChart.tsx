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
    <div className="bg-graphite text-chalk rounded-xl px-4 py-3 shadow-lg border border-white/10">
      <div className="font-mono text-xs text-amber mb-1">Age {d.age}</div>
      <div className="font-mono text-lg font-semibold">
        ${d.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
      </div>
      <div className="text-xs text-chalk/60 mt-1">
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
            tick={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fill: '#52565E' }}
          />
          <YAxis hide domain={[0, 'dataMax + 300']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232,163,61,0.08)' }} />
          <Bar dataKey="monthlyBenefit" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry) => {
              let fill = '#F0ECE3' // chalk-dim default
              if (entry.age === highlightAge) fill = '#E8A33D' // amber — user-selected age
              else if (entry.age === fraAge) fill = '#0E0F12' // graphite — FRA reference
              return <Cell key={entry.age} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
