import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Anthropic from '@anthropic-ai/sdk';

export { createCheckoutSession, createPortalSession, stripeWebhook } from './billing';

/**
 * Horizon — AI assistant backend
 * --------------------------------
 * This is the ONLY place the Anthropic API key ever exists. It lives in
 * Firebase's secret manager (set via `firebase functions:secrets:set
 * ANTHROPIC_API_KEY`), never in client code, never in an env var shipped to
 * the browser. The client calls this function; this function calls Claude.
 *
 * Per the PRD's core AI architecture principle: Claude EXPLAINS the user's
 * numbers here, it does not calculate them. Every figure Claude is allowed
 * to reference is passed in explicitly as `context`, computed by the same
 * deterministic engine (src/lib/socialSecurity.ts) that powers the rest of
 * the app. The system prompt instructs Claude not to invent or recalculate
 * anything outside that context.
 */

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

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
  { secrets: [anthropicApiKey], cors: true },
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

    const client = new Anthropic({ apiKey: anthropicApiKey.value() });

    const comparisonText = data.context.comparison
      .map((row) => `age ${row.age}: $${row.monthlyBenefit}/mo`)
      .join(', ');

    const systemPrompt = `You are the Horizon assistant, helping someone understand their own Social Security claiming options.

CRITICAL RULES:
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

    let response;
    try {
      response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: data.question }],
      });
    } catch (err) {
      console.error('Anthropic API error:', err);
      throw new HttpsError('internal', 'The assistant is temporarily unavailable. Please try again.');
    }

    const answer = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return { answer: answer || "I wasn't able to generate a response — please try rephrasing." };
  }
);

/**
 * Document reader: takes a photographed or scanned SSA/IRS/Medicare letter
 * (image or PDF) and returns a plain-English summary — what it says and
 * whether the user needs to do anything about it.
 *
 * Unlike askAssistant, there's no pre-calculated "context" to ground this
 * one against — the source of truth here IS the document itself. The
 * system prompt instead constrains Claude to only describe what's actually
 * printed on the page, not infer amounts or dates that aren't there.
 */

const MAX_BASE64_LENGTH = 8_000_000; // ~6MB file, comfortably under Claude's per-file limits

interface ReadDocumentData {
  fileBase64: string;
  mediaType: string; // e.g. 'image/jpeg', 'image/png', 'application/pdf'
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const readDocument = onCall(
  { secrets: [anthropicApiKey], cors: true, timeoutSeconds: 60 },
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

    const client = new Anthropic({ apiKey: anthropicApiKey.value() });

    const systemPrompt = `You are Horizon's document reader. The user has uploaded a letter or notice - likely from the Social Security Administration, the IRS, or Medicare/CMS.

CRITICAL RULES:
- Only describe what is actually printed in the document. Never infer, estimate, or fill in a dollar amount, date, or figure that isn't visibly present.
- If the document is blurry, cut off, or you can't confidently read a key figure, say so plainly rather than guessing.
- Structure your response in three short parts:
  1. What this document is (one sentence)
  2. What it says, in plain English (2-4 sentences, no jargon left undefined)
  3. Whether the user needs to take action, and by when if a date is given - or state clearly that no action is needed
- You are informational only, not a financial, legal, or tax advisor. Do not tell the user what decision to make - just explain what the document says.`;

    const documentBlock: Anthropic.Messages.ContentBlockParam =
      data.mediaType === 'application/pdf'
        ? {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: data.fileBase64 },
          }
        : {
            type: 'image',
            source: {
              type: 'base64',
              media_type: data.mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: data.fileBase64,
            },
          };

    let response;
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [documentBlock, { type: 'text', text: 'What does this document say, and do I need to do anything?' }],
          },
        ],
      });
    } catch (err) {
      console.error('Anthropic API error (readDocument):', err);
      throw new HttpsError('internal', 'The document reader is temporarily unavailable. Please try again.');
    }

    const summary = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return { summary: summary || "I wasn't able to read this document clearly — try a clearer photo or scan." };
  }
);
