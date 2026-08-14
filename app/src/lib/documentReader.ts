/**
 * Client wrapper for the readDocument endpoint. Converts a File to base64
 * in the browser, then hands it to the Cloudflare Worker (cf-worker/) -
 * the actual Gemini call (and the API key) lives entirely server-side
 * there. See assistant.ts for why this is a Worker and not a Firebase
 * Cloud Function.
 */
import { getAuth } from 'firebase/auth'
import { app } from './firebase'

const WORKER_URL = import.meta.env.VITE_AI_WORKER_URL as string | undefined

export const MAX_FILE_BYTES = 6 * 1024 * 1024 // 6MB
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export type DocumentType = 'SSA' | 'MEDICARE' | 'IRS_BENEFITS' | 'UNRELATED'

interface ReadDocumentRequest {
  fileBase64: string
  mediaType: string
}
interface ReadDocumentResponse {
  summary: string
  documentType: DocumentType
  isRelevant: boolean
}

export interface DocumentReading {
  summary: string
  documentType: DocumentType
  isRelevant: boolean
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip the "data:<mediatype>;base64," prefix - the function wants raw base64
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
}

export async function readDocument(file: File): Promise<DocumentReading> {
  if (!WORKER_URL) {
    throw new Error('The document reader is not configured — missing VITE_AI_WORKER_URL.')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File is too large — please use a file under 6MB.')
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type — please upload a JPEG, PNG, or PDF.')
  }
  const user = getAuth(app).currentUser
  if (!user) {
    throw new Error('Sign in to use the document reader.')
  }
  const idToken = await user.getIdToken()

  const fileBase64 = await fileToBase64(file)
  const res = await fetch(`${WORKER_URL}/read-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fileBase64, mediaType: file.type } satisfies ReadDocumentRequest),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error || 'The document reader is temporarily unavailable. Please try again.')
  }
  return (await res.json()) as ReadDocumentResponse
}
