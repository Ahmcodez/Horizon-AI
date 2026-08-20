import { verifyFirebaseToken } from './verifyFirebaseToken'
import { corsHeaders, jsonResponse } from './cors'
import { handleAskAssistant, BadRequest } from './askAssistant'
import { handleReadDocument } from './readDocument'
import { handleCreateCheckoutSession } from './checkout'
import { handleCreatePortalSession } from './portal'
import { handleStripeWebhook, InvalidSignature } from './webhook'
import type { ServiceAccount } from './googleAuth'

export interface Env {
  GEMINI_API_KEY: string
  FIREBASE_PROJECT_ID: string
  ALLOWED_ORIGINS: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRICE_PLAN_ID: string
  STRIPE_PRICE_ADVISOR_ID: string
  // The same Firebase service account JSON used by scripts/daily-news, set
  // here as a Wrangler secret (see README) — gives the billing routes
  // admin-level Firestore access the same way firebase-admin would.
  FIREBASE_SERVICE_ACCOUNT: string
}

function parseServiceAccount(env: Env): ServiceAccount {
  const parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount
  return { client_email: parsed.client_email, private_key: parsed.private_key }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Stripe calls this directly, server-to-server - no Origin header to
    // apply CORS against, no Firebase bearer token (Stripe doesn't have
    // one), and the body must stay as raw, untouched text for signature
    // verification. Handled entirely separately from every other route.
    if (url.pathname === '/stripe-webhook') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed.', { status: 405 })
      }
      try {
        const rawBody = await request.text()
        await handleStripeWebhook(rawBody, request.headers.get('stripe-signature'), {
          stripeSecretKey: env.STRIPE_SECRET_KEY,
          stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
          stripePricePlanId: env.STRIPE_PRICE_PLAN_ID,
          stripePriceAdvisorId: env.STRIPE_PRICE_ADVISOR_ID,
          serviceAccount: parseServiceAccount(env),
          firebaseProjectId: env.FIREBASE_PROJECT_ID,
        })
        return new Response('ok', { status: 200 })
      } catch (err) {
        if (err instanceof InvalidSignature) {
          console.error('Webhook signature invalid:', err.message)
          return new Response('Invalid signature', { status: 400 })
        }
        console.error('Webhook handler error:', err)
        return new Response('Internal error', { status: 500 })
      }
    }

    const origin = request.headers.get('Origin')
    const headers = corsHeaders(origin, env.ALLOWED_ORIGINS)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405, headers)
    }

    // Every remaining route requires a signed-in Firebase user, same as the
    // onCall functions this replaces did via request.auth.
    let uid: string
    let email: string | undefined
    try {
      const user = await verifyFirebaseToken(request.headers.get('Authorization'), env.FIREBASE_PROJECT_ID)
      uid = user.uid
      email = user.email
    } catch (err) {
      console.error('Auth failed:', err)
      return jsonResponse({ error: 'Sign in required.' }, 401, headers)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400, headers)
    }

    try {
      if (url.pathname === '/ask-assistant') {
        const result = await handleAskAssistant(body as never, env.GEMINI_API_KEY)
        return jsonResponse(result, 200, headers)
      }
      if (url.pathname === '/read-document') {
        const result = await handleReadDocument(body as never, env.GEMINI_API_KEY)
        return jsonResponse(result, 200, headers)
      }
      if (url.pathname === '/create-checkout-session') {
        const result = await handleCreateCheckoutSession(body as never, uid, email, {
          stripeSecretKey: env.STRIPE_SECRET_KEY,
          stripePricePlanId: env.STRIPE_PRICE_PLAN_ID,
          stripePriceAdvisorId: env.STRIPE_PRICE_ADVISOR_ID,
          serviceAccount: parseServiceAccount(env),
          firebaseProjectId: env.FIREBASE_PROJECT_ID,
        })
        return jsonResponse(result, 200, headers)
      }
      if (url.pathname === '/create-portal-session') {
        const result = await handleCreatePortalSession(body as never, uid, {
          stripeSecretKey: env.STRIPE_SECRET_KEY,
          serviceAccount: parseServiceAccount(env),
          firebaseProjectId: env.FIREBASE_PROJECT_ID,
        })
        return jsonResponse(result, 200, headers)
      }
      return jsonResponse({ error: 'Not found.' }, 404, headers)
    } catch (err) {
      if (err instanceof BadRequest) {
        return jsonResponse({ error: err.message }, 400, headers)
      }
      console.error('Handler error:', err)
      return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500, headers)
    }
  },
}
