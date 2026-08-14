import { verifyFirebaseToken } from './verifyFirebaseToken'
import { corsHeaders, jsonResponse } from './cors'
import { handleAskAssistant, BadRequest } from './askAssistant'
import { handleReadDocument } from './readDocument'

export interface Env {
  GEMINI_API_KEY: string
  FIREBASE_PROJECT_ID: string
  ALLOWED_ORIGINS: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const headers = corsHeaders(origin, env.ALLOWED_ORIGINS)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405, headers)
    }

    const url = new URL(request.url)

    // Every route requires a signed-in Firebase user, same as the onCall
    // functions this replaces did via request.auth.
    let uid: string
    try {
      const user = await verifyFirebaseToken(request.headers.get('Authorization'), env.FIREBASE_PROJECT_ID)
      uid = user.uid
    } catch (err) {
      console.error('Auth failed:', err)
      return jsonResponse({ error: 'Sign in required.' }, 401, headers)
    }
    void uid // available to route handlers if per-user logic/rate-limiting is added later

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400, headers)
    }

    try {
      if (url.pathname === '/ask-assistant') {
        const result = await handleAskAssistant(body as never, env.GEMINI_API_KEY)
        return jsonResponse(result, 200, headers)
      }
      if (url.pathname === '/read-document') {
        const result = await handleReadDocument(body as never, env.GEMINI_API_KEY)
        return jsonResponse(result, 200, headers)
      }
      return jsonResponse({ error: 'Not found.' }, 404, headers)
    } catch (err) {
      if (err instanceof BadRequest) {
        return jsonResponse({ error: err.message }, 400, headers)
      }
      console.error('Handler error:', err)
      return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500, headers)
    }
  },
}
