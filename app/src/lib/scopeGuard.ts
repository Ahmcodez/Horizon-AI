/**
 * A cheap, client-side hint for whether a question looks like it's within
 * Horizon's scope (Social Security, Medicare, and related benefits/tax
 * topics). This is NOT the enforcement mechanism - the Gemini system prompt
 * in functions/src/index.ts is the actual authority, and every question
 * still gets sent there regardless of what this returns.
 *
 * This only powers an instant, non-blocking inline hint in the UI so
 * someone typing an obviously off-topic question ("write me a poem",
 * "what's the weather") gets a heads-up before waiting on a round trip.
 * Deliberately permissive: when in doubt, this says "maybe in scope" and
 * lets the server's judgment be the one that actually declines.
 */

const OFF_TOPIC_SIGNALS = [
  /\bweather\b/i,
  /\bwrite (me )?(a |an )?(poem|song|story|essay|code|script)\b/i,
  /\bjoke\b/i,
  /\brecipe\b/i,
  /\bstock (price|market)\b/i,
  /\bcrypto(currency)?\b/i,
  /\btranslate\b/i,
  /\bsports? (score|game)\b/i,
  /\bmovie\b/i,
  /\bwho (won|is) (the )?(election|president)\b/i,
]

export function looksOffTopic(question: string): boolean {
  const trimmed = question.trim()
  if (!trimmed) return false
  return OFF_TOPIC_SIGNALS.some((pattern) => pattern.test(trimmed))
}
