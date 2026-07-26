import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan } from '../lib/billing'
import {
  useAdvisorClients,
  addAdvisorClient,
  removeAdvisorClient,
  type NewAdvisorClient,
} from '../lib/advisorClients'
import {
  generateClaimingComparison,
  getFullRetirementAge,
  calculateBreakevenAge,
} from '../lib/socialSecurity'
import BenefitChart from '../components/BenefitChart'

const EMPTY_FORM: NewAdvisorClient = {
  name: '',
  birthYear: 1965,
  pia: 2000,
  maritalStatus: 'single',
  hasNonCoveredPension: false,
  notes: '',
}

export default function AdvisorDashboardPage() {
  const { user } = useAuth()
  const { plan } = usePlan(user?.uid)
  const navigate = useNavigate()

  if (plan !== 'advisor') {
    return (
      <main className="max-w-2xl mx-auto px-8 pt-32 pb-24 text-center">
        <div className="bg-chalk-dim border border-graphite/10 rounded-3xl p-12">
          <div className="text-xs font-mono uppercase tracking-wide text-amber-deep mb-3">
            Advisor tier
          </div>
          <h1 className="font-display text-2xl font-medium mb-3">
            The client dashboard is part of the Advisor plan
          </h1>
          <p className="text-sm text-slate mb-6 max-w-md mx-auto leading-relaxed">
            Manage claiming-strategy analysis across your whole book of clients — $149/month.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="bg-amber text-graphite font-semibold px-6 py-3 rounded-full shadow-sm hover:shadow-amber hover:-translate-y-0.5 transition-all"
          >
            See plans
          </button>
        </div>
      </main>
    )
  }

  return <AdvisorDashboard advisorUid={user!.uid} />
}

function AdvisorDashboard({ advisorUid }: { advisorUid: string }) {
  const clients = useAdvisorClients(advisorUid)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<NewAdvisorClient>(EMPTY_FORM)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await addAdvisorClient(advisorUid, form)
      setForm(EMPTY_FORM)
      setShowAddForm(false)
    } finally {
      setSaving(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedId)

  return (
    <main className="max-w-5xl mx-auto px-8 pt-32 pb-24">
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-deep font-semibold mb-5">
            <span className="w-4 h-[1.5px] bg-amber-deep" />
            Advisor dashboard
          </div>
          <h1 className="font-display text-4xl font-normal tracking-tight leading-tight">
            Your clients
          </h1>
          <p className="mt-4 text-slate text-lg leading-relaxed">
            {clients.length} client{clients.length === 1 ? '' : 's'} on file.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="bg-graphite text-chalk font-semibold px-5 py-3 rounded-full hover:bg-amber hover:text-graphite transition-colors whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : '+ Add client'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-chalk-dim border border-graphite/10 rounded-3xl p-8 mb-8 shadow-sm">
          <h2 className="font-display text-lg font-medium mb-5">New client</h2>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <label className="block">
              <span className="text-sm font-medium block mb-2">Client name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-chalk border border-graphite/15 rounded-xl px-4 py-3 focus:border-amber-deep outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium block mb-2">Birth year</span>
              <input
                type="number"
                required
                value={form.birthYear}
                onChange={(e) => setForm({ ...form, birthYear: Number(e.target.value) })}
                className="w-full bg-chalk border border-graphite/15 rounded-xl px-4 py-3 font-mono focus:border-amber-deep outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium block mb-2">PIA ($/mo at FRA)</span>
              <input
                type="number"
                required
                value={form.pia}
                onChange={(e) => setForm({ ...form, pia: Number(e.target.value) })}
                className="w-full bg-chalk border border-graphite/15 rounded-xl px-4 py-3 font-mono focus:border-amber-deep outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium block mb-2">Marital status</span>
              <select
                value={form.maritalStatus}
                onChange={(e) => setForm({ ...form, maritalStatus: e.target.value as NewAdvisorClient['maritalStatus'] })}
                className="w-full bg-chalk border border-graphite/15 rounded-xl px-4 py-3 focus:border-amber-deep outline-none"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 mb-5 text-sm">
            <input
              type="checkbox"
              checked={form.hasNonCoveredPension}
              onChange={(e) => setForm({ ...form, hasNonCoveredPension: e.target.checked })}
              className="accent-amber"
            />
            Has a non-covered pension
          </label>
          <label className="block mb-6">
            <span className="text-sm font-medium block mb-2">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-chalk border border-graphite/15 rounded-xl px-4 py-3 focus:border-amber-deep outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-amber text-graphite font-semibold px-6 py-3 rounded-full disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Add client'}
          </button>
        </form>
      )}

      {clients.length === 0 && !showAddForm && (
        <div className="bg-chalk-dim rounded-3xl p-12 text-center text-slate text-sm">
          No clients yet — add your first one to get started.
        </div>
      )}

      <div className="space-y-3">
        {clients.map((client) => (
          <div key={client.id} className="bg-chalk border border-graphite/10 rounded-2xl shadow-xs overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{client.name}</div>
                <div className="text-xs text-slate font-mono mt-0.5">
                  Born {client.birthYear} · ${client.pia.toLocaleString()}/mo PIA · {client.maritalStatus}
                  {client.hasNonCoveredPension ? ' · non-covered pension' : ''}
                </div>
              </div>
              <button
                onClick={() => setSelectedId(selectedId === client.id ? null : client.id)}
                className="text-sm font-semibold text-graphite hover:text-amber-deep transition-colors whitespace-nowrap"
              >
                {selectedId === client.id ? 'Hide' : 'View analysis'}
              </button>
              <button
                onClick={() => removeAdvisorClient(advisorUid, client.id)}
                className="text-sm text-slate hover:text-warn transition-colors"
              >
                Delete
              </button>
            </div>
            {selectedId === client.id && <ClientAnalysis client={client} />}
          </div>
        ))}
      </div>

      {selectedClient === undefined && selectedId && (
        <p className="text-xs text-slate mt-4">Client no longer exists — it may have just been deleted.</p>
      )}
    </main>
  )
}

function ClientAnalysis({ client }: { client: ReturnType<typeof useAdvisorClients>[number] }) {
  const fra = getFullRetirementAge(client.birthYear)
  const comparison = generateClaimingComparison(client.pia, client.birthYear)
  const breakeven = calculateBreakevenAge(client.pia, client.birthYear, 62, 70)
  const age62 = comparison.find((r) => r.age === 62)!
  const age70 = comparison.find((r) => r.age === 70)!

  return (
    <div className="border-t border-graphite/10 bg-chalk-dim p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-chalk rounded-xl p-4">
          <div className="font-mono text-lg font-semibold">
            ${age62.monthlyBenefit.toLocaleString()} → ${age70.monthlyBenefit.toLocaleString()}
          </div>
          <div className="text-xs text-slate mt-1">monthly, 62 vs. 70</div>
        </div>
        <div className="bg-chalk rounded-xl p-4">
          <div className="font-mono text-lg font-semibold">{fra.years}{fra.months > 0 ? `y ${fra.months}m` : ''}</div>
          <div className="text-xs text-slate mt-1">full retirement age</div>
        </div>
        <div className="bg-chalk rounded-xl p-4">
          <div className="font-mono text-lg font-semibold">{breakeven ? breakeven.toFixed(1) : '—'}</div>
          <div className="text-xs text-slate mt-1">breakeven age</div>
        </div>
      </div>
      <BenefitChart data={comparison} highlightAge={70} fraAge={fra.years} />
      {client.notes && (
        <div className="mt-5 text-sm text-graphite bg-chalk rounded-xl p-4">
          <span className="font-semibold">Notes: </span>
          {client.notes}
        </div>
      )}
    </div>
  )
}
