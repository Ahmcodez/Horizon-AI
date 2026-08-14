/**
 * Minimal Gemini REST client via fetch. The @google/genai SDK (used in
 * functions/src/index.ts) assumes a Node runtime; Workers run on V8
 * isolates without Node APIs, so this talks to the same
 * generateContent endpoint directly instead. Same request shape, same
 * response shape (candidates[0].content.parts[0].text) - the model and
 * system-prompt behavior is unchanged from the Firebase Functions version.
 */

interface GeminiPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

interface GenerateContentOptions {
  apiKey: string
  model: string
  systemInstruction: string
  parts: GeminiPart[]
  maxOutputTokens: number
}

export async function generateContent(opts: GenerateContentOptions): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${opts.apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: opts.systemInstruction }] },
      contents: [{ role: 'user', parts: opts.parts }],
      generationConfig: { maxOutputTokens: opts.maxOutputTokens },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  return text.trim()
}
