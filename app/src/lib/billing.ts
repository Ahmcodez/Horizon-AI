/**
 * startCheckout/openBillingPortal call the same Cloudflare Worker as
 * assistant.ts/documentReader.ts (VITE_AI_WORKER_URL), not a Firebase Cloud
 * Function — Cloud Functions require the Blaze plan to deploy at all, and
 * this project stays on the free Spark plan. See cf-worker/README.md for
 * the Stripe-specific setup (price IDs, webhook secret) this needs.
 */
import { doc, onSnapshot } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { app, db } from './firebase'

const WORKER_URL = import.meta.env.VITE_AI_WORKER_URL as string | undefined

export type PlanId = 'free' | 'plan' | 'advisor'

export interface CustomerStatus {
  plan: PlanId
  status: string | null
}

/**
 * Local-testing-only override. When VITE_DEV_UNLOCK_ALL=true is set in
 * .env.local (never committed — see .env.example), usePlan() reports
 * 'advisor' for every signed-in user regardless of their real Stripe
 * subscription, so every gated feature (household panel, state comparison,
 * document reader, scenarios, advisor dashboard, embed widget) renders
 * unlocked for testing. This never touches Firestore or Stripe — it's a
 * pure client-side read override. Remove the env var (or leave it unset,
 * the default) to go back to real plan enforcement.
 */
const DEV_UNLOCK_ALL = import.meta.env.VITE_DEV_UNLOCK_ALL === 'true'

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

  if (DEV_UNLOCK_ALL) {
    return { plan: 'advisor', status: 'dev-unlocked' }
  }

  return state
}

async function callWorker<T>(path: string, body: unknown): Promise<T> {
  if (!WORKER_URL) {
    throw new Error('Billing is not configured — missing VITE_AI_WORKER_URL.')
  }
  const user = getAuth(app).currentUser
  if (!user) {
    throw new Error('Sign in first.')
  }
  const idToken = await user.getIdToken()

  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const responseBody = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(responseBody?.error || 'Something went wrong — please try again.')
  }
  return (await res.json()) as T
}

export async function startCheckout(plan: 'plan' | 'advisor'): Promise<void> {
  const result = await callWorker<{ url: string }>('/create-checkout-session', {
    plan,
    successUrl: `${window.location.origin}/billing?checkout=success`,
    cancelUrl: `${window.location.origin}/billing?checkout=cancelled`,
  })
  window.location.href = result.url
}

export async function openBillingPortal(): Promise<void> {
  const result = await callWorker<{ url: string }>('/create-portal-session', {
    returnUrl: `${window.location.origin}/billing`,
  })
  window.location.href = result.url
}
