# Horizon AI Worker

Serves the AI assistant (`/ask-assistant`) and document reader
(`/read-document`) via Cloudflare Workers instead of Firebase Cloud
Functions, because 2nd-gen Cloud Functions require the Blaze (pay-as-you-go)
plan for *any* outbound network call — including calling Gemini — with no
free-tier path around it. Cloudflare's Workers free tier (100k requests/day)
has no such restriction.

This is a straight port of `app/functions/src/index.ts`'s `askAssistant`
and `readDocument`: same system prompts, same SCOPE/DOCUMENT_TYPE tagging,
same validation. The only real difference is auth — Firebase's `onCall`
gives you `request.auth` for free; here, `src/verifyFirebaseToken.ts`
verifies the same Firebase ID token manually against Google's public keys.

## One-time setup

```bash
cd cf-worker
npm install
npx wrangler login          # opens a browser to authorize your Cloudflare account
```

## Configure

1. Edit `wrangler.toml`:
   - Set `FIREBASE_PROJECT_ID` to your actual Firebase project ID (same
     value as `VITE_FIREBASE_PROJECT_ID` in `app/.env.local`).
   - Set `ALLOWED_ORIGINS` to your site's origin(s), comma-separated (keep
     `http://localhost:5173` in the list for local dev against Vite's
     default port).

2. Set the Gemini API key as a secret (never goes in `wrangler.toml`,
   never committed):
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```
   Paste the same key you'd use for `firebase functions:secrets:set
   GEMINI_API_KEY`.

## Local dev

```bash
npm run dev
```
Starts the Worker at `http://localhost:8787`. Point
`app/.env.local`'s `VITE_AI_WORKER_URL` at that URL (it's the default in
`.env.example`) and run the app's own dev server as usual.

## Deploy

```bash
npm run deploy
```
Prints your live Worker URL (`https://horizon-ai-worker.<your-subdomain>.workers.dev`
by default, or a custom domain if you've configured one in the Cloudflare
dashboard). Set that as `VITE_AI_WORKER_URL` wherever the app is built for
production (e.g. your hosting provider's environment variables), then
rebuild/redeploy the frontend.

## Verifying it's working

```bash
curl -i https://<your-worker-url>/ask-assistant \
  -X POST -H "Content-Type: application/json" \
  -d '{}'
```
Should return `401 {"error":"Sign in required."}` — confirms the Worker is
live and auth is being enforced. A real request needs a valid Firebase ID
token in an `Authorization: Bearer <token>` header, which the app's own
`assistant.ts`/`documentReader.ts` attach automatically once
`VITE_AI_WORKER_URL` is set.

## Rolling back to Firebase Functions

If this project ever moves to the Blaze plan, `app/functions/src/index.ts`
still has the original `askAssistant`/`readDocument` implementations
(functionally identical, kept in sync) — re-point
`app/src/lib/assistant.ts` and `documentReader.ts` back to
`httpsCallable` and deploy those instead.
