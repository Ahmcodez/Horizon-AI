/**
 * Client wrapper for the readDocument Cloud Function. Converts a File to
 * base64 in the browser, then hands it to the function - the actual
 * Claude call (and the API key) lives entirely server-side.
 */
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase'

const functions = getFunctions(app)

export const MAX_FILE_BYTES = 6 * 1024 * 1024 // 6MB
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

interface ReadDocumentRequest {
  fileBase64: string
  mediaType: string
}
interface ReadDocumentResponse {
  summary: string
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

export async function readDocument(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File is too large — please use a file under 6MB.')
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type — please upload a JPEG, PNG, or PDF.')
  }

  const fileBase64 = await fileToBase64(file)
  const callable = httpsCallable<ReadDocumentRequest, ReadDocumentResponse>(functions, 'readDocument')
  const result = await callable({ fileBase64, mediaType: file.type })
  return result.data.summary
}
