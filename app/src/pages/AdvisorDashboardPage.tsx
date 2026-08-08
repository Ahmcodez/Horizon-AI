import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { usePlan } from '../lib/billing'
import {
  useAdvisorClients,
  addAdvisorClient,
  removeAdvisorClient,
  type NewAdvisorClient,
  type AdvisorClient,
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

function describeFirestoreError(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code === 'permission-denied') {
    return "Firestore rejected this — your account's real customers/{uid} document doesn't have plan: 'advisor' yet. The dev-unlock flag only affects what the UI shows you; it can't write that document (client writes to it are always blocked, by design). Set it manually once in the Firebase Console → Firestore → customers → your uid → plan: \"advisor\", and this will start working."
  }
  return err instanceof Error ? err.message : 'Something went wrong — please try again.'
}

export default function AdvisorDashboardPage() {
  useEffect(() => {
    document.title = 'Advisor Dashboard — Client Book | Horizon'
  }, [])

  const { user } = useAuth()
  const { plan } = usePlan(user?.uid)
  const navigate = useNavigate()

  if (plan !== 'advisor') {
    return (
      <main
        style={{ fontFamily: 'var(--font-vivid)' }}
        className="max-w-2xl mx-auto px-8 pt-32 pb-24 text-center bg-vivid-obsidian min-h-screen"
      >
        <div className="bg-graphite-veil/30 text-bone-white border border-ash-border rounded-[15px] p-12">
          <div className="text-xs uppercase tracking-[0.02em] text-fog-blue mb-3">
            Advisor tier
          </div>
          <h1 className="text-2xl font-normal mb-3">
            The client dashboard is part of the Advisor plan
          </h1>
          <p className="text-sm text-bone-white/60 mb-6 max-w-md mx-auto leading-relaxed">
            Manage claiming-strategy analysis across your whole book of clients — $149/month.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="ov-outlined-btn px-6 py-3"
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
  const { clients, error: readError } = useAdvisorClients(advisorUid)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<NewAdvisorClient>(EMPTY_FORM)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const error = writeError ?? readError

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setWriteError(null)
    try {
      await addAdvisorClient(advisorUid, form)
      setForm(EMPTY_FORM)
      setShowAddForm(false)
    } catch (err) {
      setWriteError(describeFirestoreError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(clientId: string) {
    setDeletingId(clientId)
    setWriteError(null)
    try {
      await removeAdvisorClient(advisorUid, clientId)
      if (selectedId === clientId) setSelectedId(null)
    } catch (err) {
      setWriteError(describeFirestoreError(err))
    } finally {
      setDeletingId(null)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedId)

  return (
    <main
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-5xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
            <span className="w-4 h-[1.5px] bg-fog-blue" />
            Advisor dashboard
          </div>
          <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white">
            Your clients
          </h1>
          <p className="mt-4 text-fog-blue text-lg leading-relaxed">
            {clients.length} client{clients.length === 1 ? '' : 's'} on file.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="ov-outlined-btn px-5 py-3 whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : '+ Add client'}
        </button>
      </div>

      {error && (
        <div className="bg-vivid-obsidian border border-bone-white/40 text-bone-white text-sm rounded-[10px] px-5 py-4 mb-8 leading-relaxed">
          {error}
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{ animation: 'fadeUp 0.35s cubic-bezier(.16,.8,.24,1)' }}
          className="bg-graphite-veil/20 border border-ash-border rounded-[15px] p-8 mb-8"
        >
          <h2 className="text-lg font-normal mb-5 text-bone-white">New client</h2>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-bone-white/80">Client name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 focus:border-bone-white outline-none text-bone-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-bone-white/80">Birth year</span>
              <input
                type="number"
                required
                value={form.birthYear}
                onChange={(e) => setForm({ ...form, birthYear: Number(e.target.value) })}
                className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-bone-white/80">PIA ($/mo at FRA)</span>
              <input
                type="number"
                required
                value={form.pia}
                onChange={(e) => setForm({ ...form, pia: Number(e.target.value) })}
                className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 font-mono focus:border-bone-white outline-none text-bone-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-bone-white/80">Marital status</span>
              <select
                value={form.maritalStatus}
                onChange={(e) => setForm({ ...form, maritalStatus: e.target.value as NewAdvisorClient['maritalStatus'] })}
                className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 focus:border-bone-white outline-none text-bone-white"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 mb-5 text-sm text-bone-white">
            <input
              type="checkbox"
              checked={form.hasNonCoveredPension}
              onChange={(e) => setForm({ ...form, hasNonCoveredPension: e.target.checked })}
              className="accent-bone-white"
            />
            Has a non-covered pension
          </label>
          <label className="block mb-6">
            <span className="text-sm font-normal block mb-2 text-bone-white/80">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-3 focus:border-bone-white outline-none text-bone-white"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="ov-outlined-btn px-6 py-3"
          >
            {saving ? 'Saving…' : 'Add client'}
          </button>
        </form>
      )}

      {clients.length === 0 && !showAddForm && (
        <div className="bg-graphite-veil/20 border border-ash-border rounded-[15px] p-12 text-center text-fog-blue text-sm">
          No clients yet — add your first one to get started.
        </div>
      )}

      <div className="space-y-3">
        {clients.map((client, i) => (
          <div
            key={client.id}
            style={{ animation: `fadeUp 0.35s cubic-bezier(.16,.8,.24,1) ${i * 0.04}s both` }}
            className="bg-graphite-veil/20 border border-ash-border rounded-[15px] overflow-hidden"
          >
            <div className="flex items-center gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="font-normal text-bone-white">{client.name}</div>
                <div className="text-xs text-fog-blue font-mono mt-0.5">
                  Born {client.birthYear} · ${client.pia.toLocaleString()}/mo PIA · {client.maritalStatus}
                  {client.hasNonCoveredPension ? ' · non-covered pension' : ''}
                </div>
              </div>
              <button
                onClick={() => setSelectedId(selectedId === client.id ? null : client.id)}
                className="text-sm font-normal text-bone-white hover:text-fog-blue transition-colors whitespace-nowrap"
              >
                {selectedId === client.id ? 'Hide' : 'View analysis'}
              </button>
              <button
                onClick={() => handleDelete(client.id)}
                disabled={deletingId === client.id}
                className="text-sm text-fog-blue hover:text-bone-white transition-colors disabled:opacity-40"
              >
                {deletingId === client.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
            {selectedId === client.id && <ClientAnalysis client={client} />}
          </div>
        ))}
      </div>

      {selectedClient === undefined && selectedId && (
        <p className="text-xs text-fog-blue mt-4">Client no longer exists — it may have just been deleted.</p>
      )}
    </main>
  )
}

function ClientAnalysis({ client }: { client: AdvisorClient }) {
  const fra = getFullRetirementAge(client.birthYear)
  const comparison = generateClaimingComparison(client.pia, client.birthYear)
  const breakeven = calculateBreakevenAge(client.pia, client.birthYear, 62, 70)
  const age62 = comparison.find((r) => r.age === 62)!
  const age70 = comparison.find((r) => r.age === 70)!

  return (
    <div
      style={{ animation: 'fadeUp 0.3s cubic-bezier(.16,.8,.24,1)' }}
      className="border-t border-ash-border bg-vivid-obsidian text-bone-white p-6"
    >
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-graphite-veil/30 border border-ash-border rounded-[10px] p-4">
          <div className="font-mono text-lg font-normal text-bone-white">
            ${age62.monthlyBenefit.toLocaleString()} → ${age70.monthlyBenefit.toLocaleString()}
          </div>
          <div className="text-xs text-fog-blue mt-1">monthly, 62 vs. 70</div>
        </div>
        <div className="bg-graphite-veil/30 border border-ash-border rounded-[10px] p-4">
          <div className="font-mono text-lg font-normal text-bone-white">{fra.years}{fra.months > 0 ? `y ${fra.months}m` : ''}</div>
          <div className="text-xs text-fog-blue mt-1">full retirement age</div>
        </div>
        <div className="bg-graphite-veil/30 border border-ash-border rounded-[10px] p-4">
          <div className="font-mono text-lg font-normal text-bone-white">{breakeven ? breakeven.toFixed(1) : '—'}</div>
          <div className="text-xs text-fog-blue mt-1">breakeven age</div>
        </div>
      </div>
      <BenefitChart data={comparison} highlightAge={70} fraAge={fra.years} />
      {client.notes && (
        <div className="mt-5 text-sm bg-graphite-veil/30 border border-ash-border rounded-[10px] p-4 text-bone-white">
          <span className="font-normal text-fog-blue">Notes: </span>
          {client.notes}
        </div>
      )}
    </div>
  )
}
