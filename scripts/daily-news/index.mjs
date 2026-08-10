// Horizon — daily SSA/IRS/CMS monitor, run as a standalone script via GitHub
// Actions cron instead of a Firebase Scheduled Cloud Function.
//
// WHY THIS EXISTS INSTEAD OF functions/src/alerts.ts:
// Firebase requires the paid Blaze plan to deploy ANY Cloud Function at all
// (not just ones with outbound network calls) — a project-level requirement,
// unrelated to usage or cost. Since this project stays on the free Spark
// plan, functions/src/alerts.ts can never actually run there. This script
// does the same job (fetch → detect change → classify with Gemini → write
// to Firestore) from a GitHub Actions runner instead, which is free and has
// no such restriction. It writes to Firestore directly via the Admin SDK,
// which only needs a service account key — not a Blaze-gated deployment.
//
// Produces two things, once per day:
//  1. dailyDigest/{sourceId}_{date} — a short "here's what's on this page
//     today" blurb for EVERY source, EVERY run, regardless of whether
//     anything changed. This is the general news feed.
//  2. ruleUpdates/{id} + a fan-out to profiles/{uid}/alerts — ONLY when the
//     page content actually changed AND Gemini judges it a genuine,
//     benefit-relevant rule change (not routine page churn). This is the
//     important-alert tier.
//
// functions/src/alerts.ts is left in place, dormant, ready to redeploy once
// this project is ever moved to Blaze — the two aren't meant to run
// simultaneously against the same ruleSources state.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { createHash } from 'node:crypto';

const REQUIRED_ENV = ['FIREBASE_SERVICE_ACCOUNT', 'GEMINI_API_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SOURCES = [
  { id: 'ssa-news', url: 'https://www.ssa.gov/news/en/press/releases/index.html', label: 'Social Security Administration press releases' },
  { id: 'irs-newsroom', url: 'https://www.irs.gov/newsroom', label: 'IRS newsroom' },
  { id: 'cms-newsroom', url: 'https://www.cms.gov/newsroom', label: 'CMS (Medicare) newsroom' },
];

const FETCH_TIMEOUT_MS = 20_000;

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; HorizonRuleMonitor/1.0; +https://github.com/Ahmcodez/Horizon-AI)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extracts visible text, preferring an actual content region over the raw
 * full page (nav/footer/ads otherwise dominate the character budget and
 * drown out the real headlines). Falls back to full-body text if no
 * recognizable content wrapper is found — logs a warning either way so a
 * real page-structure break is visible in the Actions log, not silent.
 */
function extractContent(html) {
  const contentMatch =
    html.match(/<main[\s\S]*?<\/main>/i) ||
    html.match(/<article[\s\S]*?<\/article>/i) ||
    html.match(/<div[^>]*id=["'][^"']*content[^"']*["'][\s\S]*?<\/div>/i);

  const region = contentMatch ? contentMatch[0] : html;

  const text = region
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000);

  if (text.length < 200) {
    console.warn(
      `  ⚠ extracted only ${text.length} chars — this source's page structure may need a custom selector`
    );
  }
  return text;
}

// Model choice: gemini-2.5-flash was deprecated for new API keys ahead of
// its Oct 2026 shutdown (returns 404 NOT_FOUND). gemini-3.5-flash-lite is
// the current GA, stable, cost-effective model recommended for exactly this
// kind of high-volume, low-latency automation task. Avoid the 'latest'
// aliases (e.g. gemini-flash-latest) here - they can point at experimental
// models with tighter rate limits, which is the opposite of what a daily
// unattended job wants.
const MODEL = 'gemini-3.5-flash-lite';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

function todayId() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function writeDailyDigest(source, excerpt) {
  const digest = await ai.models.generateContent({
    model: MODEL,
    contents: excerpt,
    config: {
      systemInstruction: `Summarize what's currently on ${source.label} in 2-3 plain-English sentences, written like a short news blurb for someone tracking Social Security, Medicare, and retirement-related tax topics. Focus on anything about benefits, premiums, taxes, deadlines, or rule changes. If the page has nothing topical right now, say so plainly in one short sentence rather than inventing content.`,
      maxOutputTokens: 220,
    },
  });

  const summary = (digest.text ?? '').trim();
  if (!summary) return;

  await db
    .collection('dailyDigest')
    .doc(`${source.id}_${todayId()}`)
    .set({
      sourceId: source.id,
      sourceLabel: source.label,
      sourceUrl: source.url,
      date: todayId(),
      summary,
      generatedAt: Date.now(),
    });
}

async function checkForImportantChange(source, excerpt) {
  const sourceRef = db.collection('ruleSources').doc(source.id);
  const sourceDoc = await sourceRef.get();
  const previous = sourceDoc.data();
  const newHash = hashText(excerpt);

  if (previous?.lastHash === newHash) {
    await sourceRef.set({ lastCheckedAt: Date.now() }, { merge: true });
    return;
  }

  const isFirstRun = !previous?.lastHash;
  await sourceRef.set(
    { url: source.url, lastHash: newHash, lastExcerpt: excerpt, lastCheckedAt: Date.now() },
    { merge: true }
  );

  if (isFirstRun) return; // establishes baseline only, nothing to compare against yet

  const analysis = await ai.models.generateContent({
    model: MODEL,
    contents: `PREVIOUS:\n${previous?.lastExcerpt ?? '(none)'}\n\nCURRENT:\n${excerpt}`,
    config: {
      systemInstruction: `You monitor ${source.label} for changes relevant to Social Security, Medicare, or retirement-related tax rules. Compare the previous and current page text. If there's a genuine new policy, rule, COLA, premium, or benefit-relevant announcement, summarize it in 2-3 plain-English sentences. If the difference is just incidental page churn (navigation, unrelated news, formatting) with nothing retirement-relevant, respond with exactly: NO_SUBSTANTIVE_CHANGE`,
      maxOutputTokens: 300,
    },
  });

  const summary = (analysis.text ?? '').trim();
  if (!summary || summary === 'NO_SUBSTANTIVE_CHANGE') return;

  const updateRef = await db.collection('ruleUpdates').add({
    sourceId: source.id,
    sourceLabel: source.label,
    summary,
    detectedAt: Date.now(),
  });

  await fanOutAlert(updateRef.id, summary);
  console.log(`  → important change detected and fanned out (${updateRef.id})`);
}

async function fanOutAlert(updateId, summary) {
  const lower = summary.toLowerCase();
  const affectsPensionUsers = /wep|gpo|windfall|pension offset|non-covered pension/.test(lower);
  const affectsEveryone = !affectsPensionUsers;

  const profilesSnap = await db.collection('profiles').get();
  const matches = profilesSnap.docs.filter((doc) => {
    const profile = doc.data();
    return affectsEveryone || (affectsPensionUsers && profile.hasNonCoveredPension === true);
  });

  const CHUNK_SIZE = 400;
  for (let i = 0; i < matches.length; i += CHUNK_SIZE) {
    const chunk = matches.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();
    chunk.forEach((doc) => {
      const alertRef = doc.ref.collection('alerts').doc();
      batch.set(alertRef, { updateId, message: summary, createdAt: Date.now(), read: false });
    });
    await batch.commit();
  }
}

async function main() {
  let succeeded = 0;
  let failed = 0;

  for (const source of SOURCES) {
    console.log(`Checking ${source.id}…`);
    try {
      const html = await fetchPage(source.url);
      const excerpt = extractContent(html);

      await writeDailyDigest(source, excerpt);
      await checkForImportantChange(source, excerpt);

      succeeded++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${source.id} failed:`, err.message);
    }
    await sleep(1500); // small gap between sources — avoids bursting the Gemini API
  }

  console.log(`Done — ${succeeded} succeeded, ${failed} failed.`);
  if (succeeded === 0) {
    console.error('All sources failed — treating this as a job failure.');
    process.exit(1);
  }
}

main();
