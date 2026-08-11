# daily-news

Standalone script that keeps Horizon's SSA/IRS/CMS monitoring actually running
on the free Firebase Spark plan — see the top-of-file comment in `index.mjs`
for the full "why does this exist" explanation. Short version: Firebase
requires the paid Blaze plan to deploy *any* Cloud Function at all, so
`app/functions/src/alerts.ts` can never run on Spark. This script does the
same job, triggered by a free GitHub Actions cron instead of Cloud Scheduler.

## What it does, every run

1. Fetches the most recent Federal Register filings for SSA, IRS, and CMS via
   the official [FederalRegister.gov API](https://www.federalregister.gov/developers/documentation/api/v1)
   (no key needed, built for automated access — not scraped HTML).
2. Writes a short plain-English summary to Firestore's `dailyDigest`
   collection for **every source, every run**, regardless of whether
   anything changed. This is the general "what's happening" feed shown in
   the app's Alerts page.
3. Compares the current filings against last run's via a content hash. If
   something genuinely new and benefit-relevant appears (judged by Gemini,
   not just "the list changed"), it's written to `ruleUpdates` and fanned
   out as a personalized alert to every matching user in `profiles/{uid}/alerts`.

## One-time setup

1. **Firebase service account**: Firebase Console → Project Settings →
   Service Accounts → "Generate new private key". Downloads a JSON file.
2. **Gemini API key**: from [Google AI Studio](https://aistudio.google.com/apikey).
3. Add both as **GitHub repository secrets** (Settings → Secrets and
   variables → Actions):
   - `FIREBASE_SERVICE_ACCOUNT` — paste the entire contents of the JSON file
   - `GEMINI_API_KEY` — the key itself
4. The workflow (`.github/workflows/daily-news.yml`) runs daily at 12:00 UTC,
   and can be triggered manually from the Actions tab any time via
   "Run workflow" — useful for testing without waiting for the cron.

## Running locally

```bash
cd scripts/daily-news
npm install
FIREBASE_SERVICE_ACCOUNT='<paste the whole JSON file as one line>' \
GEMINI_API_KEY='<your key>' \
npm start
```

## Troubleshooting

**`Missing required env var`** — one of the two secrets isn't set, or the
GitHub secret name doesn't exactly match `FIREBASE_SERVICE_ACCOUNT` /
`GEMINI_API_KEY`.

**Gemini `PERMISSION_DENIED` / "Your project has been denied access"** — this
is a known Google-side issue affecting brand-new Gemini API keys/projects,
not something in this code. It's been reported widely by other developers
since mid-2026 with no clear self-service fix. Try: (1) re-running the
workflow — it's sometimes intermittent early on for a new key, (2) posting on
the [Google AI Developer Forum](https://discuss.ai.google.dev) with your
project ID, which is how other affected developers have gotten it resolved.

**A source returns 0 documents** — check the agency slug in `SOURCES` still
matches a real agency at `https://www.federalregister.gov/agencies` (agency
pages occasionally get renamed/merged).

**Model deprecation errors** — Google periodically retires older Gemini
model versions. If `MODEL` in `index.mjs` starts erroring with something like
"no longer available", check [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
for the current recommended stable model and swap it in.
