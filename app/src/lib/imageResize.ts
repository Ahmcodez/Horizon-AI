/**
 * Client-side downscale for profile picture uploads. Cloudinary can store
 * any size, but there's no reason to upload (and have advisors wait on) a
 * multi-megabyte phone photo for a small round avatar - this shrinks it to a
 * reasonable square-ish thumbnail and re-encodes as JPEG before upload.
 */
export async function resizeImageFile(file: File, maxDimension = 480, quality = 0.85): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file // canvas unsupported — fall back to the original file

  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) return file

  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}
