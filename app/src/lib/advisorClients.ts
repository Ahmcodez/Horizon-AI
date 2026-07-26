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
export function useAdvisorClients(advisorUid: string | undefined): AdvisorClient[] {
  const [clients, setClients] = useState<AdvisorClient[]>([])

  useEffect(() => {
    if (!advisorUid) return
    const q = query(clientsCollection(advisorUid), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdvisorClient, 'id'>) })))
    })
    return unsubscribe
  }, [advisorUid])

  return clients
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
