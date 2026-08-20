/**
 * Minimal Firestore REST client for the Worker.
 *
 * Only implements getDocument/setDocument on a single doc path — everything
 * this billing integration needs (reading/writing customers/{uid}). Uses
 * the OAuth2 access token from googleAuth.ts, which carries admin-level
 * privileges (the 'datastore' scope), so these calls bypass firestore.rules
 * entirely — same trust level firebase-admin gives Cloud Functions, or
 * scripts/daily-news gets via firebase-admin in Node.
 *
 * Firestore's REST API doesn't take/return plain JSON — every field is
 * wrapped in a type tag (e.g. {stringValue: "x"}, {integerValue: "5"}).
 * toFirestoreFields/fromFirestoreFields convert to/from plain JS objects so
 * callers never have to think about this format.
 */
import { getGoogleAccessToken, type ServiceAccount } from './googleAuth'

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  throw new Error(`Unsupported Firestore field type: ${typeof value}`)
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {}
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(value)
  }
  return fields
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('booleanValue' in value) return value.booleanValue
  if ('nullValue' in value) return null
  return null
}

function fromFirestoreFields(fields: Record<string, FirestoreValue> | undefined): Record<string, unknown> {
  if (!fields) return {}
  const obj: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    obj[key] = fromFirestoreValue(value)
  }
  return obj
}

export interface FirestoreClient {
  getDocument(path: string): Promise<Record<string, unknown> | null>
  setDocument(path: string, data: Record<string, unknown>, merge?: boolean): Promise<void>
}

export function createFirestoreClient(serviceAccount: ServiceAccount, projectId: string): FirestoreClient {
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getGoogleAccessToken(serviceAccount)
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }

  return {
    async getDocument(path: string) {
      const res = await fetch(`${baseUrl}/${path}`, { headers: await authHeaders() })
      if (res.status === 404) return null
      if (!res.ok) {
        throw new Error(`Firestore getDocument failed (${res.status}): ${await res.text().catch(() => '')}`)
      }
      const data = (await res.json()) as { fields?: Record<string, FirestoreValue> }
      return fromFirestoreFields(data.fields)
    },

    async setDocument(path: string, data: Record<string, unknown>, merge = true) {
      const url = merge
        ? `${baseUrl}/${path}?${Object.keys(data)
            .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
            .join('&')}`
        : `${baseUrl}/${path}`

      const res = await fetch(url, {
        method: 'PATCH',
        headers: await authHeaders(),
        body: JSON.stringify({ fields: toFirestoreFields(data) }),
      })
      if (!res.ok) {
        throw new Error(`Firestore setDocument failed (${res.status}): ${await res.text().catch(() => '')}`)
      }
    },
  }
}
