/**
 * Thin client for the askAssistant endpoint. No API key lives here or
 * anywhere in the frontend bundle — that only exists server-side in the
 * Cloudflare Worker (cf-worker/), held in Wrangler's secret store.
 *
 * This calls a plain HTTP Worker rather than a Firebase Cloud Function,
 * because Cloud Functions require the Blaze (pay-as-you-go) plan for any
 * outbound network call, including calling Gemini. The Worker verifies the
 * same Firebase ID token manually (see cf-worker/src/verifyFirebaseToken.ts)
 * since it doesn't get Firebase's request.auth for free the way an onCall
 * function does.
 */
import { getAuth } from 'firebase/auth'
import { app } from './firebase'

const WORKER_URL = import.meta.env.VITE_AI_WORKER_URL as string | undefined

export interface ComparisonRow {
  age: number
  monthlyBenefit: number
}

export interface AssistantContext {
  birthYear: number
  pia: number
  fullRetirementAge: string
  comparison: ComparisonRow[]
  breakevenAge: number | null
}

interface AskAssistantRequest {
  question: string
  context: AssistantContext
}

interface AskAssistantResponse {
  answer: string
  inScope: boolean
}

export interface AssistantAnswer {
  answer: string
  inScope: boolean
}

export async function askAssistant(question: string, context: AssistantContext): Promise<AssistantAnswer> {
  if (!WORKER_URL) {
    throw new Error('The assistant is not configured — missing VITE_AI_WORKER_URL.')
  }
  const user = getAuth(app).currentUser
  if (!user) {
    throw new Error('Sign in to use the assistant.')
  }
  const idToken = await user.getIdToken()

  const res = await fetch(`${WORKER_URL}/ask-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ question, context } satisfies AskAssistantRequest),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error || 'The assistant is temporarily unavailable. Please try again.')
  }
  return (await res.json()) as AskAssistantResponse
}
