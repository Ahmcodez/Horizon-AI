import { createStripeClient } from './stripeClient'
import { createFirestoreClient } from './firestore'
import { BadRequest } from './askAssistant'
import type { ServiceAccount } from './googleAuth'

export type PlanId = 'plan' | 'advisor'

interface CreateCheckoutSessionRequest {
  plan: PlanId
  successUrl: string
  cancelUrl: string
}

export interface CreateCheckoutSessionEnv {
  stripeSecretKey: string
  stripePricePlanId: string
  stripePriceAdvisorId: string
  serviceAccount: ServiceAccount
  firebaseProjectId: string
}

function priceIdForPlan(plan: PlanId, env: CreateCheckoutSessionEnv): string {
  return plan === 'advisor' ? env.stripePriceAdvisorId : env.stripePricePlanId
}

/**
 * Gets the caller's existing Stripe customer ID from Firestore, or creates
 * one (and writes it back) if this is their first time upgrading. Mirrors
 * getOrCreateStripeCustomer from the dormant functions/src/billing.ts.
 */
async function getOrCreateStripeCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  firestore: ReturnType<typeof createFirestoreClient>,
  uid: string,
  email: string | undefined
): Promise<string> {
  const existing = await firestore.getDocument(`customers/${uid}`)
  const existingId = existing?.stripeCustomerId as string | undefined
  if (existingId) return existingId

  const customer = await stripe.customers.create({
    email,
    metadata: { firebaseUID: uid },
  })

  await firestore.setDocument(`customers/${uid}`, {
    stripeCustomerId: customer.id,
    plan: 'free',
    status: 'none',
  })

  return customer.id
}

export async function handleCreateCheckoutSession(
  body: CreateCheckoutSessionRequest,
  uid: string,
  userEmail: string | undefined,
  env: CreateCheckoutSessionEnv
): Promise<{ url: string }> {
  if (body.plan !== 'plan' && body.plan !== 'advisor') {
    throw new BadRequest('Unknown plan.')
  }
  if (!body.successUrl || !body.cancelUrl) {
    throw new BadRequest('Missing redirect URLs.')
  }

  const stripe = createStripeClient(env.stripeSecretKey)
  const firestore = createFirestoreClient(env.serviceAccount, env.firebaseProjectId)
  const customerId = await getOrCreateStripeCustomer(stripe, firestore, uid, userEmail)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceIdForPlan(body.plan, env), quantity: 1 }],
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    client_reference_id: uid,
    subscription_data: { metadata: { firebaseUID: uid } },
  })

  if (!session.url) {
    throw new Error('Could not start checkout — please try again.')
  }
  return { url: session.url }
}
