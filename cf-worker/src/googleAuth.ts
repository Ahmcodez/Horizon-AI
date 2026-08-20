/**
 * Google service-account OAuth2 access tokens, from a Worker.
 *
 * The Worker needs to read/write Firestore's customers/{uid} collection
 * with admin privileges — the same privilege level firebase-admin's Node
 * SDK gives Cloud Functions for free, and the same thing
 * scripts/daily-news/index.mjs uses (via firebase-admin, which works there
 * because it runs in real Node on GitHub Actions, not the Workers runtime).
 * Workers don't have Node's `crypto` module or firebase-admin, so this
 * reimplements just the piece we need: the OAuth2 JWT Bearer flow
 * (RFC 7523) using the same Firebase service account JSON already used for
 * scripts/daily-news, signed with the Workers-native Web Crypto API
 * (crypto.subtle) instead of Node crypto.
 *
 * Tokens are cached in-memory per Worker instance and reused until ~1
 * minute before they expire, so this doesn't cost a token-exchange round
 * trip on every request.
 */

export interface ServiceAccount {
  client_email: string
  private_key: string
}

interface CachedToken {
  accessToken: string
  expiresAt: number // epoch ms
}

let cached: CachedToken | null = null

const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer'

export async function getGoogleAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  if (cached && cached.expiresAt - 60_000 > Date.now()) {
    return cached.accessToken
  }

  const assertion = await buildSignedJwt(serviceAccount)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: GRANT_TYPE, assertion }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google OAuth token exchange failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cached = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cached.accessToken
}

async function buildSignedJwt(serviceAccount: ServiceAccount): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: serviceAccount.client_email,
    scope: FIRESTORE_SCOPE,
    aud: TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedClaims = base64UrlEncode(JSON.stringify(claims))
  const signingInput = `${encodedHeader}.${encodedClaims}`

  const key = await importPrivateKey(serviceAccount.private_key)
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  )

  return `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signatureBuffer))}`
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pkcs8 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryDer = base64ToBytes(pkcs8)
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

function base64ToBytes(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function base64UrlEncode(input: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(input))
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
