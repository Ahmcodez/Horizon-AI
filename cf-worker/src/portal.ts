import { createStripeClient } from './stripeClient'
import { createFirestoreClient } from './firestore'
import { BadRequest } from './askAssistant'
import type { ServiceAccount } from './googleAuth'

interface CreatePortalSessionRequest {
  returnUrl: string
}

export interface CreatePortalSessionEnv {
  stripeSecretKey: string
  serviceAccount: ServiceAccount
  firebaseProjectId: string
}

export async function handleCreatePortalSession(
  body: CreatePortalSessionRequest,
  uid: string,
  env: CreatePortalSessionEnv
): Promise<{ url: string }> {
  if (!body.returnUrl) {
    throw new BadRequest('Missing return URL.')
  }

  const firestore = createFirestoreClient(env.serviceAccount, env.firebaseProjectId)
  const customerDoc = await firestore.getDocument(`customers/${uid}`)
  const customerId = customerDoc?.stripeCustomerId as string | undefined
  if (!customerId) {
    throw new BadRequest('No billing account found — subscribe first.')
  }

  const stripe = createStripeClient(env.stripeSecretKey)
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: body.returnUrl,
  })

  return { url: session.url }
}
