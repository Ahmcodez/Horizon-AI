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
      className="bg-vivid-obsidian text-bone-white rounded-[5px] px-4 py-3 border border-ash-border"
      style={{ fontFamily: 'var(--font-vivid)' }}
    >
      <div className="text-xs text-fog-blue mb-1">Age {d.age}</div>
      <div className="text-lg font-normal">
        ${d.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
      </div>
      <div className="text-xs text-bone-white/50 mt-1">
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
            tick={{ fontFamily: 'Inter', fontSize: 12, fill: '#6F879C' }}
          />
          <YAxis hide domain={[0, 'dataMax + 300']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,253,249,0.05)' }} />
          <Bar dataKey="monthlyBenefit" radius={[2, 2, 0, 0]} maxBarSize={56}>
            {data.map((entry) => {
              let fill = 'rgba(255,253,249,0.12)' // neutral default bar
              if (entry.age === highlightAge) fill = '#FFFDF9' // bone-white — user-selected age
              else if (entry.age === fraAge) fill = '#6F879C' // fog-blue — FRA reference
              return <Cell key={entry.age} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
