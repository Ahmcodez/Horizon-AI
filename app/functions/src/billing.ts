import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import Stripe from 'stripe';
import { db } from './admin';

/**
 * Horizon — billing
 * -------------------
 * Three functions: start a Checkout session (upgrade), open the Billing
 * Portal (manage/cancel), and receive Stripe's webhook (the single source
 * of truth for what plan a customer is actually on — never trust the
 * client's word for its own subscription status).
 *
 * Plan status lives at customers/{uid} in Firestore:
 *   { stripeCustomerId, plan: 'free' | 'plan' | 'advisor', status, currentPeriodEnd }
 */

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

// Price IDs are config, not secrets — set via
// `firebase functions:config:set` is legacy; with 2nd-gen functions these
// are just environment values you can set in .env.<project-id> files in
// functions/ (git-ignored) or directly in the Firebase console per env.
const pricePlanId = defineString('STRIPE_PRICE_PLAN_ID');
const priceAdvisorId = defineString('STRIPE_PRICE_ADVISOR_ID');

type PlanId = 'plan' | 'advisor';

function planForPriceId(priceId: string): PlanId | 'free' {
  if (priceId === pricePlanId.value()) return 'plan';
  if (priceId === priceAdvisorId.value()) return 'advisor';
  return 'free';
}

function priceIdForPlan(plan: PlanId): string {
  return plan === 'advisor' ? priceAdvisorId.value() : pricePlanId.value();
}

async function getOrCreateStripeCustomer(
  stripe: Stripe,
  uid: string,
  email: string | undefined
): Promise<string> {
  const customerDoc = await db.collection('customers').doc(uid).get();
  const existing = customerDoc.data()?.stripeCustomerId as string | undefined;
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email,
    metadata: { firebaseUID: uid },
  });

  await db
    .collection('customers')
    .doc(uid)
    .set({ stripeCustomerId: customer.id, plan: 'free', status: 'none' }, { merge: true });

  return customer.id;
}

interface CreateCheckoutSessionData {
  plan: PlanId;
  successUrl: string;
  cancelUrl: string;
}

export const createCheckoutSession = onCall(
  { secrets: [stripeSecretKey], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in to upgrade.');
    }
    const data = request.data as CreateCheckoutSessionData;
    if (data.plan !== 'plan' && data.plan !== 'advisor') {
      throw new HttpsError('invalid-argument', 'Unknown plan.');
    }
    if (!data.successUrl || !data.cancelUrl) {
      throw new HttpsError('invalid-argument', 'Missing redirect URLs.');
    }

    const stripe = new Stripe(stripeSecretKey.value());
    const customerId = await getOrCreateStripeCustomer(stripe, request.auth.uid, request.auth.token.email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceIdForPlan(data.plan), quantity: 1 }],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      client_reference_id: request.auth.uid,
      subscription_data: { metadata: { firebaseUID: request.auth.uid } },
    });

    if (!session.url) {
      throw new HttpsError('internal', 'Could not start checkout — please try again.');
    }
    return { url: session.url };
  }
);

interface CreatePortalSessionData {
  returnUrl: string;
}

export const createPortalSession = onCall(
  { secrets: [stripeSecretKey], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in first.');
    }
    const data = request.data as CreatePortalSessionData;
    if (!data.returnUrl) {
      throw new HttpsError('invalid-argument', 'Missing return URL.');
    }

    const customerDoc = await db.collection('customers').doc(request.auth.uid).get();
    const customerId = customerDoc.data()?.stripeCustomerId as string | undefined;
    if (!customerId) {
      throw new HttpsError('failed-precondition', 'No billing account found — subscribe first.');
    }

    const stripe = new Stripe(stripeSecretKey.value());
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: data.returnUrl,
    });

    return { url: session.url };
  }
);

/**
 * Stripe webhook — the only place subscription status is actually written.
 * The client never sets its own plan; it only reflects whatever this
 * function has written to Firestore after Stripe confirms it server-to-server.
 */
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret], cors: false },
  async (req, res) => {
    const stripe = new Stripe(stripeSecretKey.value());
    const signature = req.headers['stripe-signature'];

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature as string,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send('Invalid signature');
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const uid = subscription.metadata?.firebaseUID;
          if (!uid) break;

          const priceId = subscription.items.data[0]?.price.id ?? '';
          const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;
          await db
            .collection('customers')
            .doc(uid)
            .set(
              {
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                plan: planForPriceId(priceId),
                status: subscription.status,
                currentPeriodEnd,
              },
              { merge: true }
            );
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const uid = subscription.metadata?.firebaseUID;
          if (!uid) break;

          await db.collection('customers').doc(uid).set(
            { plan: 'free', status: 'canceled' },
            { merge: true }
          );
          break;
        }
        default:
          // Other event types are ignored - Stripe sends many we don't act on.
          break;
      }
      res.status(200).send('ok');
    } catch (err) {
      console.error('Error handling webhook event:', err);
      res.status(500).send('Internal error');
    }
  }
);
