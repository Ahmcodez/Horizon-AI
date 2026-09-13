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

export interface PolicyUpdate {
  sourceLabel: string
  summary: string
  detectedAt: number
}

const MAX_QUESTION_LENGTH = 2000
const ASSISTANT_MODEL = 'gemini-3.5-flash-lite'

export class BadRequest extends Error {}

function formatUpdates(updates: PolicyUpdate[]): string {
  if (!updates.length) return '(none available right now)'
  return updates
    .map((u) => `- [${new Date(u.detectedAt).toISOString().slice(0, 10)}] ${u.sourceLabel}: ${u.summary}`)
    .join('\n')
}

/**
 * Same SCOPE-tagging system prompt as functions/src/index.ts's askAssistant
 * — see that file's top comment for why the tag/parse approach is used.
 * Keep these two prompts in sync if you edit one.
 *
 * recentUpdates is best-effort RAG grounding: the real, dated SSA/IRS/CMS
 * items already collected by scripts/daily-news into Firestore's
 * ruleUpdates collection. Passing an empty array is fine — the assistant
 * just says it doesn't have fresh data rather than guessing.
 */
export async function handleAskAssistant(
  data: AskAssistantData,
  apiKey: string,
  recentUpdates: PolicyUpdate[] = []
): Promise<{ answer: string; inScope: boolean }> {
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

  const systemPrompt = `You are the MyClaimAge assistant, helping someone understand Social Security, Medicare, retirement taxes, and general retirement/financial planning.

SCOPE - two tiers:
1. CALCULATOR TOPICS (grounded in this user's own numbers below): Social Security claiming ages and benefit amounts, spousal/survivor/divorced-spouse benefits, the earnings test, FRA and delayed retirement credits, Medicare (Parts A/B/D, IRMAA), federal taxation of Social Security benefits, RMDs, and state tax treatment of benefits, WEP/GPO, and recent SSA/IRS/CMS policy changes (see "Recent policy updates" below).
2. GENERAL RETIREMENT & FINANCIAL EDUCATION: 401(k)/IRA basics, employer matches, general investing concepts (diversification, index funds, risk and time horizon, compound interest), debt payoff, emergency funds, budgeting, and other everyday personal-finance questions. Answer these from general knowledge, clearly framed as education, not personalized advice.
- Chit-chat, coding help, or anything with no connection to retirement, Social Security, or personal finance is still out of scope.
- Your VERY FIRST line of output must be exactly "SCOPE: IN_SCOPE" or "SCOPE: OUT_OF_SCOPE" (nothing else on that line), followed by a blank line, then your response. Out of scope only for genuinely unrelated questions (e.g. "write me a poem", "fix my code") — not for tier-2 financial topics.

CRITICAL RULES:
- For tier 1 (calculator topics): every number you reference MUST come from "User's numbers" below. Never calculate, estimate, extrapolate, or invent a benefit figure. If a needed number isn't in the context, say so and point to the calculator or SSA.gov.
- For tier 2 (general financial education): you may explain concepts and general strategies from your own knowledge, but NEVER recommend a specific investment, security, fund, or "you should buy/sell X" - describe trade-offs and options instead, and suggest a licensed financial advisor for personalized decisions.
- When asked about "recent" or "latest" changes, ground your answer in the "Recent policy updates" list below rather than your own training data, which may be outdated. If nothing there is relevant, say you don't have a recent update on that and suggest checking SSA.gov/IRS.gov/Medicare.gov directly - don't guess at recent legislation.
- You are informational only, not a financial, legal, or tax advisor.
- Plain English, define jargon. Match length to the question: 2-4 sentences for a quick lookup, a short paragraph or a few bullet points for something that genuinely needs more (e.g. comparing spousal benefit strategies). Don't pad simple answers.

User's numbers:
- Birth year: ${data.context.birthYear}
- Full retirement age: ${data.context.fullRetirementAge}
- Primary Insurance Amount (benefit at full retirement age): $${data.context.pia}/mo
- Claiming age comparison: ${comparisonText}
- Breakeven age (62 vs. 70): ${data.context.breakevenAge ?? 'not available'}

Recent policy updates (from SSA/IRS/CMS, newest first):
${formatUpdates(recentUpdates)}`

  const raw = await generateContent({
    apiKey,
    model: ASSISTANT_MODEL,
    systemInstruction: systemPrompt,
    parts: [{ text: data.question }],
    maxOutputTokens: 700,
  })

  const { body, inScope } = parseScopeTag(raw)
  return { answer: body || "I wasn't able to generate a response — please try rephrasing.", inScope }
}

function parseScopeTag(raw: string): { body: string; inScope: boolean } {
  const match = raw.match(/^SCOPE:\s*(IN_SCOPE|OUT_OF_SCOPE)\s*\n+([\s\S]*)$/i)
  if (!match) return { body: raw, inScope: true }
  return { body: match[2].trim(), inScope: match[1].toUpperCase() === 'IN_SCOPE' }
}
