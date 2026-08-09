import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { db } from './admin';

/**
 * Horizon — rule-change monitoring
 * -----------------------------------
 * Runs on a daily schedule (not a 24/7 server) via Cloud Scheduler. Checks
 * a small set of government sources for genuine policy changes, asks Claude
 * to tell the difference between a real update and incidental page churn,
 * and fans out a plain-English alert to the users it's actually relevant to.
 *
 * IMPORTANT: this has not been exercised against the live SSA/IRS/CMS pages
 * from this build environment (no network access to those domains here) -
 * the HTML-stripping heuristic and page structure assumptions should be
 * verified against the real pages after deploy, since government sites
 * occasionally restructure their markup in ways a crude text-extraction
 * approach may need adjusting for.
 *
 * CURRENTLY DORMANT: this project runs on the free Spark plan, which cannot
 * deploy ANY Cloud Function (a project-level Firebase restriction, not
 * usage-based) - so this file cannot run at all right now. The actively
 * running equivalent is scripts/daily-news/index.mjs, triggered by a free
 * GitHub Actions cron (.github/workflows/daily-news.yml) instead of Cloud
 * Scheduler. Redeploy this file instead of the script if this project ever
 * moves to Blaze - the two share the same ruleSources/ruleUpdates Firestore
 * shape, but aren't meant to run simultaneously against the same state.
 */

const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface RuleSource {
  id: string;
  url: string;
  label: string;
}

const SOURCES: RuleSource[] = [
  { id: 'ssa-news', url: 'https://www.ssa.gov/news/press/releases/', label: 'Social Security Administration press releases' },
  { id: 'irs-newsroom', url: 'https://www.irs.gov/newsroom', label: 'IRS newsroom' },
  { id: 'cms-newsroom', url: 'https://www.cms.gov/newsroom', label: 'CMS (Medicare) newsroom' },
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000); // first ~4000 chars of visible text - enough to catch a new headline or press release
}

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export const checkRuleUpdates = onSchedule(
  { schedule: 'every 24 hours', secrets: [geminiApiKey], timeoutSeconds: 300 },
  async () => {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    for (const source of SOURCES) {
      try {
        const res = await fetch(source.url, { headers: { 'User-Agent': 'HorizonRuleMonitor/1.0' } });
        if (!res.ok) {
          console.warn(`[${source.id}] fetch failed: ${res.status}`);
          continue;
        }
        const html = await res.text();
        const excerpt = stripHtml(html);
        const newHash = hashText(excerpt);

        const sourceRef = db.collection('ruleSources').doc(source.id);
        const sourceDoc = await sourceRef.get();
        const previous = sourceDoc.data();

        if (previous?.lastHash === newHash) {
          await sourceRef.set({ lastCheckedAt: Date.now() }, { merge: true });
          continue;
        }

        const isFirstRun = !previous?.lastHash;

        await sourceRef.set(
          { url: source.url, lastHash: newHash, lastExcerpt: excerpt, lastCheckedAt: Date.now() },
          { merge: true }
        );

        if (isFirstRun) {
          // Nothing to compare against yet - this run just establishes the baseline.
          continue;
        }

        const analysis = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `PREVIOUS:\n${previous?.lastExcerpt ?? '(none)'}\n\nCURRENT:\n${excerpt}`,
          config: {
            systemInstruction: `You monitor ${source.label} for changes relevant to Social Security, Medicare, or retirement-related tax rules. Compare the previous and current page text. If there's a genuine new policy, rule, COLA, premium, or benefit-relevant announcement, summarize it in 2-3 plain-English sentences. If the difference is just incidental page churn (navigation, unrelated news, formatting) with nothing retirement-relevant, respond with exactly: NO_SUBSTANTIVE_CHANGE`,
            maxOutputTokens: 300,
          },
        });

        const summary = (analysis.text ?? '').trim();

        if (!summary || summary === 'NO_SUBSTANTIVE_CHANGE') continue;

        const updateRef = await db.collection('ruleUpdates').add({
          sourceId: source.id,
          sourceLabel: source.label,
          summary,
          detectedAt: Date.now(),
        });

        await fanOutAlert(updateRef.id, summary);
      } catch (err) {
        console.error(`Error checking source ${source.id}:`, err);
        // Continue to the next source rather than failing the whole run.
      }
    }
  }
);

/**
 * Segment-level fan-out: matches a detected update against user profiles
 * using simple keyword relevance, and writes an alert into each matching
 * user's alerts subcollection.
 *
 * Deliberately NOT a per-user Claude call with their exact dollar figures -
 * doing that for every user on every update would multiply API cost by the
 * user count. A worthwhile future enhancement is batching true per-user
 * personalization for paid users only, reusing the askAssistant grounding
 * pattern, rather than calling Claude once per user synchronously here.
 */
async function fanOutAlert(updateId: string, summary: string): Promise<void> {
  const lower = summary.toLowerCase();
  const affectsPensionUsers = /wep|gpo|windfall|pension offset|non-covered pension/.test(lower);
  const affectsEveryone = !affectsPensionUsers;

  const profilesSnap = await db.collection('profiles').get();
  const matches = profilesSnap.docs.filter((profileDoc) => {
    const profile = profileDoc.data();
    return affectsEveryone || (affectsPensionUsers && profile.hasNonCoveredPension === true);
  });

  // Firestore batches cap at 500 writes - chunk defensively even though
  // early user counts won't come close to that.
  const CHUNK_SIZE = 400;
  for (let i = 0; i < matches.length; i += CHUNK_SIZE) {
    const chunk = matches.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();
    chunk.forEach((profileDoc) => {
      const alertRef = profileDoc.ref.collection('alerts').doc();
      batch.set(alertRef, { updateId, message: summary, createdAt: Date.now(), read: false });
    });
    await batch.commit();
  }
}
