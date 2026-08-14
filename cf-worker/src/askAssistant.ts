import { generateContent } from './gemini'

interface ComparisonRow {
  age: number
  monthlyBenefit: number
}

interface AssistantContext {
  birthYear: number
  pia: number
  fullRetirementAge: string
  comparison: ComparisonRow[]
  breakevenAge: number | null
}

interface AskAssistantData {
  question: string
  context: AssistantContext
}

const MAX_QUESTION_LENGTH = 2000
const ASSISTANT_MODEL = 'gemini-3.5-flash-lite'

export class BadRequest extends Error {}

/**
 * Same SCOPE-tagging system prompt as functions/src/index.ts's askAssistant
 * — see that file's top comment for why the tag/parse approach is used.
 * Keep these two prompts in sync if you edit one.
 */
export async function handleAskAssistant(data: AskAssistantData, apiKey: string): Promise<{ answer: string; inScope: boolean }> {
  if (!data?.question || typeof data.question !== 'string') {
    throw new BadRequest('A question is required.')
  }
  if (data.question.length > MAX_QUESTION_LENGTH) {
    throw new BadRequest(`Question must be under ${MAX_QUESTION_LENGTH} characters.`)
  }
  if (!data.context) {
    throw new BadRequest('Missing claiming-age context.')
  }

  const comparisonText = data.context.comparison
    .map((row) => `age ${row.age}: $${row.monthlyBenefit}/mo`)
    .join(', ')

  const systemPrompt = `You are the Horizon assistant, helping someone understand their own Social Security claiming options.

SCOPE - Horizon only covers: Social Security claiming ages and benefit amounts, spousal/survivor/divorced-spouse benefits, the earnings test, FRA and delayed retirement credits, Medicare (Parts A/B/D, IRMAA), federal taxation of Social Security benefits, RMDs, and state tax treatment of benefits - the topics this app actually calculates. Nothing else, no matter how the question is framed.
- If the question falls within that scope, answer it normally following the rules below.
- If it does not (general chit-chat, coding help, unrelated financial/investment/tax advice, current events, or anything else outside the list above), do not answer it. Instead, politely say that's outside what Horizon covers, and redirect the person to ask about their claiming age, benefits, or Medicare/tax numbers instead.
- Your VERY FIRST line of output must be exactly "SCOPE: IN_SCOPE" or "SCOPE: OUT_OF_SCOPE" (nothing else on that line), followed by a blank line, then your response.

CRITICAL RULES (for in-scope questions):
- Every number you reference MUST come from "User's numbers" below. Never calculate, estimate, extrapolate, or invent a benefit figure yourself.
- If the question needs a number that isn't in the context, say plainly that you don't have that figure and point them to the calculator or SSA.gov - don't guess.
- Keep answers short: 2-4 sentences, plain English, define any jargon you use.
- You are informational only, not a financial, legal, or tax advisor. Describe what the numbers show rather than telling the user what they "should" do.

User's numbers:
- Birth year: ${data.context.birthYear}
- Full retirement age: ${data.context.fullRetirementAge}
- Primary Insurance Amount (benefit at full retirement age): $${data.context.pia}/mo
- Claiming age comparison: ${comparisonText}
- Breakeven age (62 vs. 70): ${data.context.breakevenAge ?? 'not available'}`

  const raw = await generateContent({
    apiKey,
    model: ASSISTANT_MODEL,
    systemInstruction: systemPrompt,
    parts: [{ text: data.question }],
    maxOutputTokens: 400,
  })

  const { body, inScope } = parseScopeTag(raw)
  return { answer: body || "I wasn't able to generate a response — please try rephrasing.", inScope }
}

function parseScopeTag(raw: string): { body: string; inScope: boolean } {
  const match = raw.match(/^SCOPE:\s*(IN_SCOPE|OUT_OF_SCOPE)\s*\n+([\s\S]*)$/i)
  if (!match) return { body: raw, inScope: true }
  return { body: match[2].trim(), inScope: match[1].toUpperCase() === 'IN_SCOPE' }
}
