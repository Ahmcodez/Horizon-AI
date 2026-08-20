/**
 * Stripe client configured for the Workers runtime. Stripe's SDK defaults
 * to Node's `http` module, which doesn't exist here — createFetchHttpClient
 * switches it to the Fetch API, which Workers do have.
 */
import Stripe from 'stripe'

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  })
}
