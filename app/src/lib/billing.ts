import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { app, db } from './firebase'

const functions = getFunctions(app)

export type PlanId = 'free' | 'plan' | 'advisor'

export interface CustomerStatus {
  plan: PlanId
  status: string | null
}

/**
 * Real-time subscription to the user's plan. Reads only - the client never
 * writes its own plan; that only happens server-side once Stripe confirms
 * payment via the webhook. Starting state is 'free' until (or unless) a
 * customers/{uid} document exists.
 */
export function usePlan(uid: string | undefined): CustomerStatus {
  const [state, setState] = useState<CustomerStatus>({ plan: 'free', status: null })

  useEffect(() => {
    if (!uid) return
    const unsubscribe = onSnapshot(doc(db, 'customers', uid), (snap) => {
      const data = snap.data()
      setState({
        plan: (data?.plan as PlanId) ?? 'free',
        status: (data?.status as string) ?? null,
      })
    })
    return unsubscribe
  }, [uid])

  return state
}

export async function startCheckout(plan: 'plan' | 'advisor'): Promise<void> {
  const callable = httpsCallable<
    { plan: 'plan' | 'advisor'; successUrl: string; cancelUrl: string },
    { url: string }
  >(functions, 'createCheckoutSession')

  const result = await callable({
    plan,
    successUrl: `${window.location.origin}/billing?checkout=success`,
    cancelUrl: `${window.location.origin}/billing?checkout=cancelled`,
  })
  window.location.href = result.data.url
}

export async function openBillingPortal(): Promise<void> {
  const callable = httpsCallable<{ returnUrl: string }, { url: string }>(functions, 'createPortalSession')
  const result = await callable({ returnUrl: `${window.location.origin}/billing` })
  window.location.href = result.data.url
}
