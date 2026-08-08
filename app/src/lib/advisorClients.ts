import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

export interface AdvisorClient {
  id: string
  name: string
  birthYear: number
  pia: number
  maritalStatus: 'single' | 'married' | 'widowed'
  hasNonCoveredPension: boolean
  notes: string
  createdAt: number
}

export type NewAdvisorClient = Omit<AdvisorClient, 'id' | 'createdAt'>

function clientsCollection(advisorUid: string) {
  return collection(db, 'advisorClients', advisorUid, 'clients')
}

/** Real-time list of an advisor's clients, newest first. */
export function useAdvisorClients(advisorUid: string | undefined): {
  clients: AdvisorClient[]
  error: string | null
} {
  const [clients, setClients] = useState<AdvisorClient[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!advisorUid) return
    const q = query(clientsCollection(advisorUid), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setError(null)
        setClients(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdvisorClient, 'id'>) })))
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? "Can't load clients — your account's real plan document isn't set to 'advisor' yet (see the note above)."
            : err.message
        )
      }
    )
    return unsubscribe
  }, [advisorUid])

  return { clients, error }
}

export async function addAdvisorClient(advisorUid: string, client: NewAdvisorClient): Promise<void> {
  await addDoc(clientsCollection(advisorUid), { ...client, createdAt: Date.now() })
}

export async function updateAdvisorClient(
  advisorUid: string,
  clientId: string,
  updates: Partial<NewAdvisorClient>
): Promise<void> {
  await updateDoc(doc(db, 'advisorClients', advisorUid, 'clients', clientId), updates)
}

export async function removeAdvisorClient(advisorUid: string, clientId: string): Promise<void> {
  await deleteDoc(doc(db, 'advisorClients', advisorUid, 'clients', clientId))
}
