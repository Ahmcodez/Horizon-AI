/**
 * Advisor lead-generation / matching
 * --------------------------------------------
 * A separate system from advisorClients.ts (which is an advisor's own
 * manually-entered book of off-platform clients, used purely for running
 * claiming-age analysis on their behalf). This file is the real two-sided
 * marketplace: a Plan-tier user browses a directory of advisors who've
 * opted in to accepting new clients, picks one, and sends them their case.
 * That creates a `matches/{matchId}` document both sides can see and a
 * `messages` subcollection they use to talk it through inside the app.
 *
 * Collections (see firestore.rules for the access rules):
 *   advisorProfiles/{advisorUid}         - public directory entry
 *   matches/{matchId}                    - one client<->advisor relationship
 *   matches/{matchId}/messages/{msgId}   - their conversation
 */
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

export interface AdvisorProfile {
  advisorUid: string
  displayName: string
  credential: string
  bio: string
  statesLicensed: string
  specialties: string
  yearsExperience: number
  acceptingClients: boolean
  updatedAt: number
}

export type NewAdvisorProfile = Omit<AdvisorProfile, 'advisorUid' | 'updatedAt'>

export const EMPTY_ADVISOR_PROFILE: NewAdvisorProfile = {
  displayName: '',
  credential: '',
  bio: '',
  statesLicensed: '',
  specialties: '',
  yearsExperience: 0,
  acceptingClients: false,
}

function advisorProfileRef(advisorUid: string) {
  return doc(db, 'advisorProfiles', advisorUid)
}

/** Real-time read of an advisor's own public profile (or null if not set up yet). */
export function useAdvisorProfile(advisorUid: string | undefined): {
  profile: AdvisorProfile | null
  loaded: boolean
} {
  const [profile, setProfile] = useState<AdvisorProfile | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!advisorUid) return
    const unsubscribe = onSnapshot(advisorProfileRef(advisorUid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as AdvisorProfile) : null)
      setLoaded(true)
    })
    return unsubscribe
  }, [advisorUid])

  return { profile, loaded }
}

export async function saveAdvisorProfile(advisorUid: string, profile: NewAdvisorProfile): Promise<void> {
  await setDoc(
    advisorProfileRef(advisorUid),
    { ...profile, advisorUid, updatedAt: Date.now() },
    { merge: true }
  )
}

/** Real-time directory of advisors currently accepting new clients, most experienced first. */
export function useAdvisorDirectory(): {
  advisors: AdvisorProfile[]
  loading: boolean
  error: string | null
} {
  const [advisors, setAdvisors] = useState<AdvisorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'advisorProfiles'), where('acceptingClients', '==', true))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as AdvisorProfile)
        list.sort((a, b) => b.yearsExperience - a.yearsExperience)
        setAdvisors(list)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  return { advisors, loading, error }
}

export interface AdvisorMatch {
  id: string
  clientUid: string
  clientName: string
  clientEmail: string
  advisorUid: string
  advisorName: string
  initialMessage: string
  resolved: boolean
  createdAt: number
  lastMessageAt: number
  lastMessagePreview: string
  lastSenderRole: 'client' | 'advisor'
}

function matchesCollection() {
  return collection(db, 'matches')
}

/**
 * Creates a new match and its first message in one go. Called when a
 * client picks an advisor from the directory and submits their case.
 */
export async function createAdvisorMatch(opts: {
  clientUid: string
  clientName: string
  clientEmail: string
  advisorUid: string
  advisorName: string
  message: string
}): Promise<string> {
  const now = Date.now()
  const ref = await addDoc(matchesCollection(), {
    clientUid: opts.clientUid,
    clientName: opts.clientName,
    clientEmail: opts.clientEmail,
    advisorUid: opts.advisorUid,
    advisorName: opts.advisorName,
    initialMessage: opts.message,
    resolved: false,
    createdAt: now,
    lastMessageAt: now,
    lastMessagePreview: opts.message,
    lastSenderRole: 'client',
  })
  await addDoc(collection(db, 'matches', ref.id, 'messages'), {
    senderUid: opts.clientUid,
    senderRole: 'client',
    text: opts.message,
    createdAt: now,
  })
  return ref.id
}

/** Real-time list of a client's own matches, most recently active first. */
export function useClientMatches(clientUid: string | undefined): {
  matches: AdvisorMatch[]
  error: string | null
} {
  const [matches, setMatches] = useState<AdvisorMatch[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientUid) return
    const q = query(matchesCollection(), where('clientUid', '==', clientUid))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdvisorMatch, 'id'>) }))
        list.sort((a, b) => b.lastMessageAt - a.lastMessageAt)
        setMatches(list)
        setError(null)
      },
      (err) => setError(err.message)
    )
    return unsubscribe
  }, [clientUid])

  return { matches, error }
}

/** Real-time list of clients matched to a given advisor, most recently active first. */
export function useAdvisorMatches(advisorUid: string | undefined): {
  matches: AdvisorMatch[]
  error: string | null
} {
  const [matches, setMatches] = useState<AdvisorMatch[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!advisorUid) return
    const q = query(matchesCollection(), where('advisorUid', '==', advisorUid))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdvisorMatch, 'id'>) }))
        list.sort((a, b) => b.lastMessageAt - a.lastMessageAt)
        setMatches(list)
        setError(null)
      },
      (err) => setError(err.message)
    )
    return unsubscribe
  }, [advisorUid])

  return { matches, error }
}

export async function setMatchResolved(matchId: string, resolved: boolean): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), { resolved })
}

export interface MatchMessage {
  id: string
  senderUid: string
  senderRole: 'client' | 'advisor'
  text: string
  createdAt: number
}

/** Real-time conversation thread for one match, oldest first. */
export function useMatchMessages(matchId: string | undefined): MatchMessage[] {
  const [messages, setMessages] = useState<MatchMessage[]>([])

  useEffect(() => {
    if (!matchId) return
    const q = query(collection(db, 'matches', matchId, 'messages'), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MatchMessage, 'id'>) })))
    })
    return unsubscribe
  }, [matchId])

  return messages
}

export async function sendMatchMessage(
  matchId: string,
  senderUid: string,
  senderRole: 'client' | 'advisor',
  text: string
): Promise<void> {
  const now = Date.now()
  await addDoc(collection(db, 'matches', matchId, 'messages'), {
    senderUid,
    senderRole,
    text,
    createdAt: now,
  })
  await updateDoc(doc(db, 'matches', matchId), {
    lastMessageAt: now,
    lastMessagePreview: text,
    lastSenderRole: senderRole,
  })
}
