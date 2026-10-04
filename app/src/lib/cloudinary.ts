/**
 * Cloudinary uploads (unsigned)
 * --------------------------------------------
 * File storage for advisor profile pictures and chat attachments. This
 * project has no backend server and stays off Firebase's paid Blaze plan
 * (see billing.ts), so Firebase Storage isn't an option - Cloudinary's free
 * tier plus an *unsigned* upload preset lets the browser upload directly,
 * with no secret key exposed client-side. Firestore only ever stores the
 * resulting URL, never the file itself.
 *
 * Setup (one-time, in the Cloudinary dashboard - see docs/CLOUDINARY.md):
 *   1. Create a free account at cloudinary.com.
 *   2. Settings -> Upload -> Upload presets -> Add upload preset.
 *      Set "Signing Mode" to Unsigned. Optionally restrict allowed formats.
 *   3. Copy your "Cloud name" from the dashboard home page.
 *   4. Put both in .env.local:
 *        VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *        VITE_CLOUDINARY_UPLOAD_PRESET=your-preset-name
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

export interface CloudinaryUpload {
  url: string
  publicId: string
  bytes: number
  format: string
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET)
}

/**
 * Uploads a single file to Cloudinary's unsigned upload endpoint. `resourceType`
 * picks the right endpoint - 'image' for photos/thumbnails, 'auto' for
 * anything else (PDFs, etc. - Cloudinary calls these "raw" but 'auto' figures
 * it out and still gives us a working delivery URL).
 */
export async function uploadToCloudinary(
  file: File,
  resourceType: 'image' | 'auto' = 'auto'
): Promise<CloudinaryUpload> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'File uploads aren\'t configured yet — missing VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET.'
    )
  }

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST',
    body,
  })

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new Error(problem?.error?.message || 'Upload failed — please try again.')
  }

  const data = (await res.json()) as { secure_url: string; public_id: string; bytes: number; format: string }
  return { url: data.secure_url, publicId: data.public_id, bytes: data.bytes, format: data.format }
}
