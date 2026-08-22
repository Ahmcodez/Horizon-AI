import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db, app } from './firebase'

const WORKER_URL = import.meta.env.VITE_AI_WORKER_URL as string | undefined

export interface AlertItem {
  id: string
  message: string
  createdAt: number
  read: boolean
}

/** Real-time subscription to a user's rule-change alerts, newest first. */
export function useAlerts(uid: string | undefined): AlertItem[] {
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'profiles', uid, 'alerts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      setAlerts(
        snap.docs.map((d) => ({
          id: d.id,
          message: d.data().message,
          createdAt: d.data().createdAt,
          read: d.data().read ?? false,
        }))
      )
    })
    return unsubscribe
  }, [uid])

  return alerts
}

export async function markAlertRead(uid: string, alertId: string): Promise<void> {
  await updateDoc(doc(db, 'profiles', uid, 'alerts', alertId), { read: true })
}

export async function dismissAlert(uid: string, alertId: string): Promise<void> {
  await deleteDoc(doc(db, 'profiles', uid, 'alerts', alertId))
}
