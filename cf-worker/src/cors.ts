export function corsHeaders(origin: string | null, allowedOrigins: string): Record<string, string> {
  const allowList = allowedOrigins.split(',').map((o) => o.trim())
  const allowOrigin = origin && allowList.includes(origin) ? origin : allowList[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

export function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
