/**
 * Thin client for the askAssistant Cloud Function. No API key lives here or
 * anywhere in the frontend bundle — that only exists server-side in
 * functions/src/index.ts, held in Firebase's secret manager.
 */
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase'

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

const functions = getFunctions(app)

export async function askAssistant(question: string, context: AssistantContext): Promise<AssistantAnswer> {
  const callable = httpsCallable<AskAssistantRequest, AskAssistantResponse>(functions, 'askAssistant')
  const result = await callable({ question, context })
  return { answer: result.data.answer, inScope: result.data.inScope }
}
