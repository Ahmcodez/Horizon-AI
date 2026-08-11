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

// Sources: instead of scraping ssa.gov/irs.gov/cms.gov's own HTML (which
// blocks automated requests even with browser-like headers — confirmed via
// a live test run), this uses the official FederalRegister.gov REST API.
// It's built by the National Archives specifically for automated access to
// exactly this kind of data: no API key, CORS-enabled, structured JSON
// (title/abstract/date/link) instead of fragile HTML scraping. Every real
// SSA/IRS/CMS regulatory notice, rule, and proposed rule gets published
// there as a matter of law, so this is a more complete and more reliable
// source than each agency's own newsroom page, not just a workaround.
const SOURCES = [
  { id: 'ssa-news', agencySlug: 'social-security-administration', label: 'Social Security Administration' },
  { id: 'irs-newsroom', agencySlug: 'internal-revenue-service', label: 'IRS' },
  { id: 'cms-newsroom', agencySlug: 'centers-for-medicare-medicaid-services', label: 'CMS (Medicare)' },
];

const FETCH_TIMEOUT_MS = 20_000;

async function fetchAgencyDocs(agencySlug) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const params = new URLSearchParams();
    params.append('conditions[agencies][]', agencySlug);
    params.append('order', 'newest');
    params.append('per_page', '10');
    for (const field of ['title', 'abstract', 'publication_date', 'html_url', 'type']) {
      params.append('fields[]', field);
    }
    const url = `https://www.federalregister.gov/api/v1/documents.json?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Turns the last 10 documents into a compact text block for Gemini to
 * summarize/compare — one line per document, newest first.
 */
function docsToExcerpt(docs) {
  return docs
    .map((d) => `${d.publication_date} [${d.type}] ${d.title} — ${d.abstract ?? '(no abstract)'}`)
    .join('\n')
    .slice(0, 6000);
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
      systemInstruction: `Below is a list of the most recent Federal Register filings from ${source.label}. Summarize what's notable in 2-3 plain-English sentences, written like a short news blurb for someone tracking Social Security, Medicare, and retirement-related tax topics. Focus on anything about benefits, premiums, taxes, deadlines, or rule changes. If nothing in the list is topical, say so plainly in one short sentence rather than inventing content.`,
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
    contents: `PREVIOUS LIST:\n${previous?.lastExcerpt ?? '(none)'}\n\nCURRENT LIST:\n${excerpt}`,
    config: {
      systemInstruction: `You monitor ${source.label}'s recent Federal Register filings for changes relevant to Social Security, Medicare, or retirement-related tax rules. Compare the previous and current lists. If a genuinely new filing represents a policy, rule, COLA, premium, or benefit-relevant announcement, summarize it in 2-3 plain-English sentences. If the difference is just older items rolling off the list with nothing new and retirement-relevant, respond with exactly: NO_SUBSTANTIVE_CHANGE`,
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
      const docs = await fetchAgencyDocs(source.agencySlug);
      const excerpt = docsToExcerpt(docs);
      const sourceWithUrl = {
        ...source,
        url: `https://www.federalregister.gov/agencies/${source.agencySlug}`,
      };

      await writeDailyDigest(sourceWithUrl, excerpt);
      await checkForImportantChange(sourceWithUrl, excerpt);

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
