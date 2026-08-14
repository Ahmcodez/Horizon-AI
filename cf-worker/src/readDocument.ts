import { generateContent } from './gemini'
import { BadRequest } from './askAssistant'

interface ReadDocumentData {
  fileBase64: string
  mediaType: string
}

type DocumentType = 'SSA' | 'MEDICARE' | 'IRS_BENEFITS' | 'UNRELATED'

const MAX_BASE64_LENGTH = 8_000_000 // ~6MB file
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DOCUMENT_MODEL = 'gemini-3.5-flash-lite'

/**
 * Same DOCUMENT_TYPE-tagging system prompt as functions/src/index.ts's
 * readDocument — see that file's top comment for why the tag/parse
 * approach is used. Keep these two prompts in sync if you edit one.
 */
export async function handleReadDocument(
  data: ReadDocumentData,
  apiKey: string
): Promise<{ summary: string; documentType: DocumentType; isRelevant: boolean }> {
  if (!data?.fileBase64 || !data?.mediaType) {
    throw new BadRequest('A file and media type are required.')
  }
  if (data.fileBase64.length > MAX_BASE64_LENGTH) {
    throw new BadRequest('File is too large (max ~6MB).')
  }
  if (data.mediaType !== 'application/pdf' && !SUPPORTED_IMAGE_TYPES.includes(data.mediaType)) {
    throw new BadRequest('Unsupported file type — use a JPEG, PNG, or PDF.')
  }

  const systemPrompt = `You are Horizon's document reader. It exists for ONE purpose: explaining Social Security, Medicare/CMS, and related IRS benefit-taxation letters and notices. It is not a general document summarizer.

CLASSIFY FIRST - your VERY FIRST line of output must be exactly one of these (nothing else on that line), followed by a blank line, then your response:
- "DOCUMENT_TYPE: SSA" - a Social Security Administration letter or notice
- "DOCUMENT_TYPE: MEDICARE" - a Medicare/CMS letter or notice (enrollment, IRMAA, Part B/D, etc.)
- "DOCUMENT_TYPE: IRS_BENEFITS" - an IRS notice specifically about Social Security benefit taxation or a related benefits matter
- "DOCUMENT_TYPE: UNRELATED" - anything else: a different kind of document entirely, an unrelated letter, a random photo, or a document too unclear to identify

IF UNRELATED: after the blank line, write one short, polite sentence explaining this reader is only for SSA, Medicare, or IRS benefits letters, and suggest the person use a general document tool for anything else. Do not attempt to summarize an unrelated document's contents.

IF SSA, MEDICARE, OR IRS_BENEFITS: after the blank line, follow these rules:
- Only describe what is actually printed in the document. Never infer, estimate, or fill in a dollar amount, date, or figure that isn't visibly present.
- If the document is blurry, cut off, or you can't confidently read a key figure, say so plainly rather than guessing.
- Structure your response in three short parts:
  1. What this document is (one sentence)
  2. What it says, in plain English (2-4 sentences, no jargon left undefined)
  3. Whether the user needs to take action, and by when if a date is given - or state clearly that no action is needed
- You are informational only, not a financial, legal, or tax advisor. Do not tell the user what decision to make - just explain what the document says.`

  const raw = await generateContent({
    apiKey,
    model: DOCUMENT_MODEL,
    systemInstruction: systemPrompt,
    parts: [
      { inlineData: { mimeType: data.mediaType, data: data.fileBase64 } },
      { text: 'What does this document say, and do I need to do anything?' },
    ],
    maxOutputTokens: 600,
  })

  const { body, documentType } = parseDocumentTypeTag(raw)
  return {
    summary: body || "I wasn't able to read this document clearly — try a clearer photo or scan.",
    documentType,
    isRelevant: documentType !== 'UNRELATED',
  }
}

function parseDocumentTypeTag(raw: string): { body: string; documentType: DocumentType } {
  const match = raw.match(/^DOCUMENT_TYPE:\s*(SSA|MEDICARE|IRS_BENEFITS|UNRELATED)\s*\n+([\s\S]*)$/i)
  if (!match) return { body: raw, documentType: 'UNRELATED' }
  return { body: match[2].trim(), documentType: match[1].toUpperCase() as DocumentType }
}
