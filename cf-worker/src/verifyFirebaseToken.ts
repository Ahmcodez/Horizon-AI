import { createRemoteJWKSet, jwtVerify } from 'jose'

/**
 * Verifies a Firebase Auth ID token without the Firebase Admin SDK (which
 * needs Node APIs this Worker doesn't have). This replicates what
 * `request.auth` gave us for free with Firebase's onCall functions:
 * signature verification against Google's public keys, plus the issuer/
 * audience/expiry checks Firebase's own client libraries document at
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 *
 * The JWKS is fetched once and cached in-memory by `createRemoteJWKSet`
 * across requests to the same Worker instance (it handles Google's key
 * rotation automatically), so this doesn't cost a network round trip on
 * every request.
 */
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
const jwks = createRemoteJWKSet(new URL(JWKS_URL))

export interface VerifiedUser {
  uid: string
}

export async function verifyFirebaseToken(authHeader: string | null, projectId: string): Promise<VerifiedUser> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header.')
  }
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    throw new Error('Missing bearer token.')
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  })

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Token has no subject (uid).')
  }

  return { uid: payload.sub }
}
