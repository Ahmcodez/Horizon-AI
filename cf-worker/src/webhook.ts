import Stripe from 'stripe'
import { createStripeClient } from './stripeClient'
import { createFirestoreClient } from './firestore'
import type { ServiceAccount } from './googleAuth'
import type { PlanId } from './checkout'

export interface StripeWebhookEnv {
  stripeSecretKey: string
  stripeWebhookSecret: string
  stripePricePlanId: string
  stripePriceAdvisorId: string
  serviceAccount: ServiceAccount
  firebaseProjectId: string
}

export class InvalidSignature extends Error {}

function planForPriceId(priceId: string, env: StripeWebhookEnv): PlanId | 'free' {
  if (priceId === env.stripePricePlanId) return 'plan'
  if (priceId === env.stripePriceAdvisorId) return 'advisor'
  return 'free'
}

/**
 * Verifies and processes one Stripe webhook delivery.
 *
 * rawBody MUST be the untouched request body text — Stripe's signature
 * covers the exact bytes sent, so parsing it as JSON first (which
 * re-serializes with different whitespace) breaks verification. Callers
 * must read the body with request.text(), not request.json().
 *
 * Uses constructEventAsync with Stripe.createSubtleCryptoProvider() rather
 * than the default constructEvent — the synchronous version depends on
 * Node's crypto module, which Workers don't have; the async version uses
 * the Workers-native Web Crypto API instead.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string | null,
  env: StripeWebhookEnv
): Promise<void> {
  const stripe = createStripeClient(env.stripeSecretKey)

  if (!signature) {
    throw new InvalidSignature('Missing stripe-signature header.')
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env.stripeWebhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    )
  } catch (err) {
    throw new InvalidSignature(err instanceof Error ? err.message : 'Signature verification failed.')
  }

  const firestore = createFirestoreClient(env.serviceAccount, env.firebaseProjectId)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const uid = subscription.metadata?.firebaseUID
      if (!uid) break

      const priceId = subscription.items.data[0]?.price.id ?? ''
      const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null

      await firestore.setDocument(`customers/${uid}`, {
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        plan: planForPriceId(priceId, env),
        status: subscription.status,
        currentPeriodEnd,
      })
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const uid = subscription.metadata?.firebaseUID
      if (!uid) break

      await firestore.setDocument(`customers/${uid}`, { plan: 'free', status: 'canceled' })
      break
    }
    default:
      // Other event types are ignored - Stripe sends many we don't act on.
      break
  }
}
