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
  useAdvisorProfile,
  saveAdvisorProfile,
  EMPTY_ADVISOR_PROFILE,
  useAdvisorMatches,
  setMatchResolved,
  type NewAdvisorProfile,
} from '../lib/advisorMatching'
import {
  generateClaimingComparison,
  getFullRetirementAge,
  calculateBreakevenAge,
} from '../lib/socialSecurity'
import BenefitChart from '../components/BenefitChart'
import MatchThread from '../components/MatchThread'

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
    document.title = 'Advisor Dashboard — Client Book | MyClaimAge'
  }, [])

  const { user } = useAuth()
  const { plan } = usePlan(user?.uid)
  const navigate = useNavigate()

  if (plan !== 'advisor') {
    return (
      <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
      <main
        className="max-w-2xl mx-auto px-8 pt-32 pb-24 text-center"
      >
        <div className="hover-glow-lp bg-lp-chalk text-lp-graphite border border-lp-line-strong rounded-[15px] p-12">
          <div className="text-xs uppercase tracking-[0.02em] text-lp-slate mb-3">
            Advisor tier
          </div>
          <h1 className="text-2xl font-normal mb-3">
            The client dashboard is part of the Advisor plan
          </h1>
          <p className="text-sm text-lp-slate mb-6 max-w-md mx-auto leading-relaxed">
            Manage claiming-strategy analysis across your whole book of clients — $149/month.
          </p>
          <button
            onClick={() => navigate('/billing')}
            className="lp-gradient-btn px-6 py-3"
          >
            See plans
          </button>
        </div>
      </main>
      </div>
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
    <div className="min-h-screen bg-lp-chalk-dim" style={{ fontFamily: 'var(--font-jakarta)' }}>
    <main
      className="max-w-5xl mx-auto px-8 pt-32 pb-24"
    >
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <div className="text-[14px] uppercase tracking-[0.02em] text-lp-slate mb-5 flex items-center gap-2">
            <span className="w-4 h-[1.5px] bg-lp-slate" />
            Advisor dashboard
          </div>
          <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-lp-graphite">
            Your clients
          </h1>
          <p className="mt-4 text-lp-slate text-lg leading-relaxed">
            {clients.length} client{clients.length === 1 ? '' : 's'} on file.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="ov-outlined-btn-lp px-5 py-3 whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : '+ Add client'}
        </button>
      </div>

      <AdvisorProfileEditor advisorUid={advisorUid} />
      <ClientMatches advisorUid={advisorUid} />

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-lp-bad text-sm rounded-[10px] px-5 py-4 mb-8 leading-relaxed">
          {error}
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{ animation: 'fadeUp 0.35s cubic-bezier(.16,.8,.24,1)' }}
          className="bg-lp-chalk border border-lp-line-strong rounded-[15px] p-8 mb-8"
        >
          <h2 className="text-lg font-normal mb-5 text-lp-graphite">New client</h2>
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-lp-slate">Client name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-lp-slate">Birth year</span>
              <input
                type="number"
                required
                value={form.birthYear}
                onChange={(e) => setForm({ ...form, birthYear: Number(e.target.value) })}
                className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 font-mono focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-lp-slate">PIA ($/mo at FRA)</span>
              <input
                type="number"
                required
                value={form.pia}
                onChange={(e) => setForm({ ...form, pia: Number(e.target.value) })}
                className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 font-mono focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
              />
            </label>
            <label className="block">
              <span className="text-sm font-normal block mb-2 text-lp-slate">Marital status</span>
              <select
                value={form.maritalStatus}
                onChange={(e) => setForm({ ...form, maritalStatus: e.target.value as NewAdvisorClient['maritalStatus'] })}
                className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 mb-5 text-sm text-lp-graphite">
            <input
              type="checkbox"
              checked={form.hasNonCoveredPension}
              onChange={(e) => setForm({ ...form, hasNonCoveredPension: e.target.checked })}
              className="accent-[var(--color-lp-cyan)]"
            />
            Has a non-covered pension
          </label>
          <label className="block mb-6">
            <span className="text-sm font-normal block mb-2 text-lp-slate">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="lp-gradient-btn px-6 py-3"
          >
            {saving ? 'Saving…' : 'Add client'}
          </button>
        </form>
      )}

      <h2 className="text-xl font-normal text-lp-graphite mb-4">Your manual client book</h2>

      {clients.length === 0 && !showAddForm && (
        <div className="bg-lp-chalk border border-lp-line-strong rounded-[15px] p-12 text-center text-lp-slate text-sm">
          No clients yet — add your first one to get started.
        </div>
      )}

      <div className="space-y-3">
        {clients.map((client, i) => (
          <div
            key={client.id}
            style={{ animation: `fadeUp 0.35s cubic-bezier(.16,.8,.24,1) ${i * 0.04}s both` }}
            className="hover-glow-lp bg-lp-chalk border border-lp-line-strong rounded-[15px] overflow-hidden"
          >
            <div className="flex items-center gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="font-normal text-lp-graphite">{client.name}</div>
                <div className="text-xs text-lp-slate font-mono mt-0.5">
                  Born {client.birthYear} · ${client.pia.toLocaleString()}/mo PIA · {client.maritalStatus}
                  {client.hasNonCoveredPension ? ' · non-covered pension' : ''}
                </div>
              </div>
              <button
                onClick={() => setSelectedId(selectedId === client.id ? null : client.id)}
                className="text-sm font-normal text-[var(--color-lp-cyan)] hover:text-lp-graphite transition-colors whitespace-nowrap"
              >
                {selectedId === client.id ? 'Hide' : 'View analysis'}
              </button>
              <button
                onClick={() => handleDelete(client.id)}
                disabled={deletingId === client.id}
                className="text-sm text-lp-slate hover:text-lp-graphite transition-colors disabled:opacity-40"
              >
                {deletingId === client.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
            {selectedId === client.id && <ClientAnalysis client={client} />}
          </div>
        ))}
      </div>

      {selectedClient === undefined && selectedId && (
        <p className="text-xs text-lp-slate mt-4">Client no longer exists — it may have just been deleted.</p>
      )}
    </main>
    </div>
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
      className="border-t border-lp-line-strong bg-lp-chalk-dim text-lp-graphite p-6"
    >
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-lp-chalk border border-lp-line-strong rounded-[10px] p-4">
          <div className="font-mono text-lg font-normal text-lp-graphite">
            ${age62.monthlyBenefit.toLocaleString()} → ${age70.monthlyBenefit.toLocaleString()}
          </div>
          <div className="text-xs text-lp-slate mt-1">monthly, 62 vs. 70</div>
        </div>
        <div className="bg-lp-chalk border border-lp-line-strong rounded-[10px] p-4">
          <div className="font-mono text-lg font-normal text-lp-graphite">{fra.years}{fra.months > 0 ? `y ${fra.months}m` : ''}</div>
          <div className="text-xs text-lp-slate mt-1">full retirement age</div>
        </div>
        <div className="bg-lp-chalk border border-lp-line-strong rounded-[10px] p-4">
          <div className="font-mono text-lg font-normal text-lp-graphite">{breakeven ? breakeven.toFixed(1) : '—'}</div>
          <div className="text-xs text-lp-slate mt-1">breakeven age</div>
        </div>
      </div>
      <BenefitChart data={comparison} highlightAge={70} fraAge={fra.years} />
      {client.notes && (
        <div className="mt-5 text-sm bg-lp-chalk border border-lp-line-strong rounded-[10px] p-4 text-lp-graphite">
          <span className="font-normal text-lp-slate">Notes: </span>
          {client.notes}
        </div>
      )}
    </div>
  )
}

/**
 * The advisor's own public directory listing - what a Plan-tier client sees
 * in the "Find an advisor" directory. Saved separately from the manual
 * client book above; toggling "Accepting new clients" off hides the advisor
 * from the directory without deleting anything.
 */
function AdvisorProfileEditor({ advisorUid }: { advisorUid: string }) {
  const { profile, loaded } = useAdvisorProfile(advisorUid)
  const [form, setForm] = useState<NewAdvisorProfile>(EMPTY_ADVISOR_PROFILE)
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded || initialized) return
    if (profile) {
      setForm({
        displayName: profile.displayName,
        credential: profile.credential,
        bio: profile.bio,
        statesLicensed: profile.statesLicensed,
        specialties: profile.specialties,
        yearsExperience: profile.yearsExperience,
        acceptingClients: profile.acceptingClients,
      })
    }
    setInitialized(true)
  }, [loaded, initialized, profile])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await saveAdvisorProfile(advisorUid, form)
      setSaved(true)
    } catch (err) {
      setError(describeFirestoreError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-lp-chalk border border-lp-line-strong rounded-[15px] p-8 mb-8">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-lg font-normal text-lp-graphite">Your public profile</h2>
        <label className="flex items-center gap-2 text-sm text-lp-graphite whitespace-nowrap">
          <input
            type="checkbox"
            checked={form.acceptingClients}
            onChange={(e) => setForm({ ...form, acceptingClients: e.target.checked })}
            className="accent-[var(--color-lp-cyan)]"
          />
          Accepting new clients
        </label>
      </div>
      <p className="text-xs text-lp-slate mb-5 leading-relaxed">
        This is what clients see in the "Find an advisor" directory. Only visible while "Accepting
        new clients" is checked.
      </p>
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <label className="block">
            <span className="text-sm font-normal block mb-2 text-lp-slate">Display name</span>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
            />
          </label>
          <label className="block">
            <span className="text-sm font-normal block mb-2 text-lp-slate">Credential</span>
            <input
              type="text"
              value={form.credential}
              onChange={(e) => setForm({ ...form, credential: e.target.value })}
              placeholder="e.g. CFP®"
              className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
            />
          </label>
          <label className="block">
            <span className="text-sm font-normal block mb-2 text-lp-slate">States licensed</span>
            <input
              type="text"
              value={form.statesLicensed}
              onChange={(e) => setForm({ ...form, statesLicensed: e.target.value })}
              placeholder="e.g. CA, NY, TX"
              className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
            />
          </label>
          <label className="block">
            <span className="text-sm font-normal block mb-2 text-lp-slate">Years of experience</span>
            <input
              type="number"
              min={0}
              value={form.yearsExperience}
              onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
              className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 font-mono focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-normal block mb-2 text-lp-slate">Specialties</span>
          <input
            type="text"
            value={form.specialties}
            onChange={(e) => setForm({ ...form, specialties: e.target.value })}
            placeholder="e.g. Social Security claiming, retirement income planning"
            className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
          />
        </label>
        <label className="block">
          <span className="text-sm font-normal block mb-2 text-lp-slate">Bio</span>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full bg-lp-chalk border border-lp-line-strong rounded-[5px] px-4 py-3 focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
          />
        </label>

        {error && <div className="text-sm text-lp-bad">{error}</div>}
        {saved && !error && <div className="text-sm text-lp-good">Saved.</div>}

        <button type="submit" disabled={saving} className="lp-gradient-btn px-6 py-3">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}

/**
 * Clients matched to this advisor through the in-app directory - separate
 * from the manually-entered client book above. Each row expands into the
 * shared MatchThread conversation UI.
 */
function ClientMatches({ advisorUid }: { advisorUid: string }) {
  const { matches, error } = useAdvisorMatches(advisorUid)
  const [openId, setOpenId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function toggleResolved(matchId: string, resolved: boolean) {
    setUpdatingId(matchId)
    try {
      await setMatchResolved(matchId, resolved)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="mb-10">
      <h2 className="text-xl font-normal text-lp-graphite mb-4">
        Client matches {matches.length > 0 ? `(${matches.length})` : ''}
      </h2>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-lp-bad text-sm rounded-[10px] px-5 py-4 mb-4">
          {error}
        </div>
      )}

      {matches.length === 0 && !error && (
        <div className="bg-lp-chalk border border-lp-line-strong rounded-[15px] p-8 text-center text-lp-slate text-sm mb-8">
          No clients have matched with you yet. Make sure your public profile above is set to
          "Accepting new clients."
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-4 mb-8">
          {matches.map((m) => (
            <div key={m.id} className="bg-lp-chalk border border-lp-line-strong rounded-[15px] overflow-hidden">
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-normal text-lp-graphite">{m.clientName}</div>
                  <div className="text-xs text-lp-slate mt-0.5 truncate">
                    {m.lastSenderRole === 'client' ? 'They said: ' : 'You said: '}
                    {m.lastMessagePreview}
                  </div>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                  {m.resolved && (
                    <span className="text-[10px] uppercase tracking-wide border border-lp-line-strong text-lp-slate px-2 py-1 rounded-[5px]">
                      Resolved
                    </span>
                  )}
                  <button
                    onClick={() => toggleResolved(m.id, !m.resolved)}
                    disabled={updatingId === m.id}
                    className="text-xs text-lp-slate hover:text-lp-graphite transition-colors disabled:opacity-40"
                  >
                    {m.resolved ? 'Reopen' : 'Mark resolved'}
                  </button>
                  <button
                    onClick={() => setOpenId(openId === m.id ? null : m.id)}
                    className="text-sm font-normal text-[var(--color-lp-cyan)] hover:text-lp-graphite transition-colors"
                  >
                    {openId === m.id ? 'Hide' : 'Open'}
                  </button>
                </div>
              </div>
              {openId === m.id && (
                <MatchThread matchId={m.id} viewerUid={advisorUid} viewerRole="advisor" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
