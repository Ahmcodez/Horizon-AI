# MyClaimAge AI Worker

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

## Stripe setup (checkout, billing portal, webhook)

Same reasoning as the AI routes: `createCheckoutSession`, `createPortalSession`,
and the `stripeWebhook` handler in `app/functions/src/billing.ts` are real
but undeployable on Spark. `src/checkout.ts`, `src/portal.ts`, and
`src/webhook.ts` are straight ports of that same logic, running here instead.

1. In your Stripe Dashboard, create two recurring Prices — "Plan" ($12/mo)
   and "Advisor" ($149/mo) — if you haven't already. Copy each price ID
   (starts with `price_`) into `wrangler.toml`'s `STRIPE_PRICE_PLAN_ID` and
   `STRIPE_PRICE_ADVISOR_ID`. These aren't secret, so they live in
   `wrangler.toml` directly, not as a Wrangler secret.

2. Set three more secrets:
   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY
   npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
   ```
   `STRIPE_SECRET_KEY` is from Stripe Dashboard → Developers → API keys —
   use the **test** key (`sk_test_...`) first and verify the full flow
   before ever switching to `sk_live_...`. `FIREBASE_SERVICE_ACCOUNT` is the
   entire contents of the service account JSON file (Firebase Console →
   Project Settings → Service Accounts → Generate new private key) pasted
   as one value — the same file `scripts/daily-news` uses, so if you've
   already generated one for that, reuse it here. This is what lets the
   Worker read/write `customers/{uid}` in Firestore without needing
   `firestore.rules` to allow it (same principle as `firebase-admin` —
   admin credentials bypass security rules entirely).

3. `STRIPE_WEBHOOK_SECRET` has a chicken-and-egg problem: Stripe generates
   it only after you register a webhook endpoint, but the endpoint needs a
   real deployed Worker URL to point at. So: **deploy first** (`npm run
   deploy`, see below) to get your Worker URL, **then** go to Stripe
   Dashboard → Developers → Webhooks → Add endpoint, point it at
   `https://<your-worker-url>/stripe-webhook`, select the events
   `customer.subscription.created`, `customer.subscription.updated`, and
   `customer.subscription.deleted`, and Stripe will show you a signing
   secret (`whsec_...`) — set that as the last secret:
   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```
   Redeploy (`npm run deploy`) once more after adding this so it's picked up.

4. Verify: from your app, start a test-mode checkout for either plan. After
   completing it with [Stripe's test card](https://docs.stripe.com/testing)
   (`4242 4242 4242 4242`, any future expiry/CVC), check Stripe Dashboard →
   Developers → Webhooks → your endpoint → recent deliveries — you should
   see a `200` response, and the corresponding `customers/{uid}` document in
   Firestore should now show `plan: "plan"` (or `"advisor"`) and
   `status: "active"`.

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

The billing routes (`/create-checkout-session`, `/create-portal-session`)
work the same way — a `401` with no auth header confirms they're live too.
The one route that's an exception is `/stripe-webhook`, since Stripe calls
it directly without a Firebase token:
```bash
curl -i https://<your-worker-url>/stripe-webhook -X POST -d '{}'
```
Should return `400 Invalid signature` — confirms the endpoint exists and is
correctly rejecting requests that aren't really from Stripe.

## Rolling back to Firebase Functions

If this project ever moves to the Blaze plan, `app/functions/src/index.ts`
and `app/functions/src/billing.ts` still have the original
`askAssistant`/`readDocument`/`createCheckoutSession`/`createPortalSession`/
`stripeWebhook` implementations (functionally identical, kept in sync) —
re-point `app/src/lib/assistant.ts`, `documentReader.ts`, and `billing.ts`
back to `httpsCallable` and deploy those instead.
