import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';

export { createCheckoutSession, createPortalSession, stripeWebhook } from './billing';
export { checkRuleUpdates } from './alerts';
export { embedCalculate } from './embed';
export { seedSampleAlerts } from './seed';

/**
 * Horizon — AI assistant backend
 * --------------------------------
 * This is the ONLY place the Gemini API key ever exists. It lives in
 * Firebase's secret manager (set via `firebase functions:secrets:set
 * GEMINI_API_KEY`), never in client code, never in an env var shipped to
 * the browser. The client calls this function; this function calls Gemini.
 *
 * SWITCHED FROM CLAUDE TO GEMINI (per product decision to use Gemini's free
 * tier for now). Two things worth remembering about that choice:
 *  1. Gemini's free tier allows Google to use prompts/responses to improve
 *     their models. This app's prompts include real people's birth years,
 *     benefit amounts, and (for the document reader) uploaded government
 *     letters - worth disclosing in the privacy policy while on free tier,
 *     and worth revisiting once there are real paying users.
 *  2. The free tier's rate limit (roughly 10-15 requests/minute, shared
 *     across the WHOLE app, not per user) is low enough that a handful of
 *     simultaneous users could realistically hit 429 errors. Fine for
 *     testing and early low-volume use; enabling billing before real
 *     launch is worth planning for.
 *
 * Per the PRD's core AI architecture principle: Gemini EXPLAINS the user's
 * numbers here, it does not calculate them. Every figure it's allowed to
 * reference is passed in explicitly as `context`, computed by the same
 * deterministic engine (src/lib/socialSecurity.ts) that powers the rest of
 * the app. The system prompt instructs it not to invent or recalculate
 * anything outside that context.
 *
 * SCOPE ENFORCEMENT: both askAssistant and readDocument are restricted to
 * Horizon's actual subject matter (Social Security, Medicare, and related
 * benefits/tax topics) via their system prompts, not via keyword filtering
 * or a separate moderation call. Each prompt requires the model's first
 * line of output to be a structured tag - "SCOPE: IN_SCOPE/OUT_OF_SCOPE"
 * for the assistant, "DOCUMENT_TYPE: SSA/MEDICARE/IRS_BENEFITS/UNRELATED"
 * for the document reader - which the parseScopeTag/parseDocumentTypeTag
 * helpers below strip out and return as a typed field (`inScope`,
 * `isRelevant`) rather than leaving embedded in the answer text. Both
 * helpers default to the permissive outcome (in-scope / unrelated→false
 * relevance is the one exception, see its comment) if the model doesn't
 * follow the format, so a parsing miss degrades to "answer normally"
 * rather than silently blocking a legitimate question.
 */

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// gemini-2.5-flash and gemini-2.5-flash-lite are deprecated for new API
// keys ahead of their Oct 2026 shutdown (return 404 NOT_FOUND) - same issue
// hit and fixed in scripts/daily-news/index.mjs. gemini-3.5-flash-lite is
// the current GA replacement: low-latency, generous free-tier limits, and
// (per Google's docs) explicitly designed for document parsing too, so one
// model now covers both the chat assistant and the document reader.
const ASSISTANT_MODEL = 'gemini-3.5-flash-lite';
const DOCUMENT_MODEL = 'gemini-3.5-flash-lite';

interface ComparisonRow {
  age: number;
  monthlyBenefit: number;
}

interface AssistantContext {
  birthYear: number;
  pia: number;
  fullRetirementAge: string;
  comparison: ComparisonRow[];
  breakevenAge: number | null;
}

interface AskAssistantData {
  question: string;
  context: AssistantContext;
}

const MAX_QUESTION_LENGTH = 2000;

export const askAssistant = onCall(
  { secrets: [geminiApiKey], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in to use the assistant.');
    }

    const data = request.data as AskAssistantData;
    if (!data?.question || typeof data.question !== 'string') {
      throw new HttpsError('invalid-argument', 'A question is required.');
    }
    if (data.question.length > MAX_QUESTION_LENGTH) {
      throw new HttpsError('invalid-argument', `Question must be under ${MAX_QUESTION_LENGTH} characters.`);
    }
    if (!data.context) {
      throw new HttpsError('invalid-argument', 'Missing claiming-age context.');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    const comparisonText = data.context.comparison
      .map((row) => `age ${row.age}: $${row.monthlyBenefit}/mo`)
      .join(', ');

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
- Breakeven age (62 vs. 70): ${data.context.breakevenAge ?? 'not available'}`;

    let answer: string;
    let inScope = true;
    try {
      const response = await ai.models.generateContent({
        model: ASSISTANT_MODEL,
        contents: data.question,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 400,
        },
      });
      const raw = (response.text ?? '').trim();
      const parsed = parseScopeTag(raw);
      answer = parsed.body;
      inScope = parsed.inScope;
    } catch (err) {
      console.error('Gemini API error:', err);
      throw new HttpsError('internal', 'The assistant is temporarily unavailable. Please try again.');
    }

    return {
      answer: answer || "I wasn't able to generate a response — please try rephrasing.",
      inScope,
    };
  }
);

/**
 * Strips a leading "SCOPE: IN_SCOPE" / "SCOPE: OUT_OF_SCOPE" tag off a
 * model response. If the model didn't follow the format (rare, but models
 * occasionally drop instructions), default to in-scope so a normal answer
 * still reaches the user rather than being mislabeled or blanked out.
 */
function parseScopeTag(raw: string): { body: string; inScope: boolean } {
  const match = raw.match(/^SCOPE:\s*(IN_SCOPE|OUT_OF_SCOPE)\s*\n+([\s\S]*)$/i);
  if (!match) return { body: raw, inScope: true };
  return { body: match[2].trim(), inScope: match[1].toUpperCase() === 'IN_SCOPE' };
}

/**
 * Document reader: takes a photographed or scanned SSA/IRS/Medicare letter
 * (image or PDF) and returns a plain-English summary — what it says and
 * whether the user needs to do anything about it.
 *
 * Unlike askAssistant, there's no pre-calculated "context" to ground this
 * one against — the source of truth here IS the document itself. The
 * system prompt instead constrains Gemini to only describe what's actually
 * printed on the page, not infer amounts or dates that aren't there.
 */

const MAX_BASE64_LENGTH = 8_000_000; // ~6MB file

interface ReadDocumentData {
  fileBase64: string;
  mediaType: string; // e.g. 'image/jpeg', 'image/png', 'application/pdf'
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const readDocument = onCall(
  { secrets: [geminiApiKey], cors: true, timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in to use the document reader.');
    }

    const data = request.data as ReadDocumentData;
    if (!data?.fileBase64 || !data?.mediaType) {
      throw new HttpsError('invalid-argument', 'A file and media type are required.');
    }
    if (data.fileBase64.length > MAX_BASE64_LENGTH) {
      throw new HttpsError('invalid-argument', 'File is too large (max ~6MB).');
    }
    if (data.mediaType !== 'application/pdf' && !SUPPORTED_IMAGE_TYPES.includes(data.mediaType)) {
      throw new HttpsError('invalid-argument', 'Unsupported file type — use a JPEG, PNG, or PDF.');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    const systemPrompt = `You are Horizon's document reader. It exists for ONE purpose: explaining Social Security, Medicare/CMS, and related IRS benefit-taxation letters and notices. It is not a general document summarizer.

CLASSIFY FIRST - your VERY FIRST line of output must be exactly one of these (nothing else on that line), followed by a blank line, then your response:
- "DOCUMENT_TYPE: SSA" - a Social Security Administration letter or notice
- "DOCUMENT_TYPE: MEDICARE" - a Medicare/CMS letter or notice (enrollment, IRMAA, Part B/D, etc.)
- "DOCUMENT_TYPE: IRS_BENEFITS" - an IRS notice specifically about Social Security benefit taxation or a related benefits matter
- "DOCUMENT_TYPE: UNRELATED" - anything else: a different kind of document entirely, an unrelated letter, a random photo, or a document too unclear to identify

IF UNRELATED: after the blank line, write one short, polite sentence explaining this reader is only for SSA, Medicare, or IRS benefits letters, and suggest the person use a general document tool for anything else. Do not attempt to summarize an unrelated document's contents.

IF SSA, MEDICARE, OR IRS_BENEFITS: after the blank line, follow these rules:
- Only describe what is actually printed in the document. Never infer, estimate, or fill in a dollar amount, date, or figure that isn't visibly present.
- If the document is blurry, cut off, or you can't confidently read a key figure, say so plainly rather than guessing.
- Structure your response in three short parts:
  1. What this document is (one sentence)
  2. What it says, in plain English (2-4 sentences, no jargon left undefined)
  3. Whether the user needs to take action, and by when if a date is given - or state clearly that no action is needed
- You are informational only, not a financial, legal, or tax advisor. Do not tell the user what decision to make - just explain what the document says.`;

    let summary: string;
    let documentType: DocumentType = 'UNRELATED';
    try {
      const response = await ai.models.generateContent({
        model: DOCUMENT_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: data.mediaType, data: data.fileBase64 } },
              { text: 'What does this document say, and do I need to do anything?' },
            ],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 600,
        },
      });
      const raw = (response.text ?? '').trim();
      const parsed = parseDocumentTypeTag(raw);
      summary = parsed.body;
      documentType = parsed.documentType;
    } catch (err) {
      console.error('Gemini API error (readDocument):', err);
      throw new HttpsError('internal', 'The document reader is temporarily unavailable. Please try again.');
    }

    return {
      summary: summary || "I wasn't able to read this document clearly — try a clearer photo or scan.",
      documentType,
      isRelevant: documentType !== 'UNRELATED',
    };
  }
);

type DocumentType = 'SSA' | 'MEDICARE' | 'IRS_BENEFITS' | 'UNRELATED';

/**
 * Strips the leading "DOCUMENT_TYPE: X" classification tag off a model
 * response. Falls back to UNRELATED (safest default - it just means the
 * client shows the "not a supported document" state) if the model didn't
 * follow the format.
 */
function parseDocumentTypeTag(raw: string): { body: string; documentType: DocumentType } {
  const match = raw.match(/^DOCUMENT_TYPE:\s*(SSA|MEDICARE|IRS_BENEFITS|UNRELATED)\s*\n+([\s\S]*)$/i);
  if (!match) return { body: raw, documentType: 'UNRELATED' };
  return { body: match[2].trim(), documentType: match[1].toUpperCase() as DocumentType };
}
