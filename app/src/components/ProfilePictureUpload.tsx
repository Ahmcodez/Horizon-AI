import { useRef, useState } from 'react'
import { uploadToCloudinary, isCloudinaryConfigured } from '../lib/cloudinary'
import { resizeImageFile } from '../lib/imageResize'

const MAX_SOURCE_BYTES = 8 * 1024 * 1024 // 8MB — generous, since we downscale before upload anyway

/**
 * A round avatar that doubles as the upload control - click it to pick a
 * photo. Shows the existing photo (or initials) at rest, a local preview the
 * instant a file's picked, then swaps to the real Cloudinary URL on success.
 */
export default function ProfilePictureUpload({
  photoUrl,
  displayName,
  onChange,
}: {
  photoUrl: string
  displayName: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shown = preview ?? photoUrl
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('That image is too large — please use one under 8MB.')
      return
    }
    if (!isCloudinaryConfigured()) {
      setError('Image uploads aren\'t configured yet — ask whoever manages this site to set up Cloudinary.')
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)
    try {
      const resized = await resizeImageFile(file)
      const result = await uploadToCloudinary(resized, 'image')
      onChange(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(localUrl)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden border border-lp-line-strong bg-lp-chalk-dim flex items-center justify-center flex-shrink-0 group"
        aria-label="Change profile picture"
      >
        {shown ? (
          <img src={shown} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-normal text-lp-slate">{initials || '?'}</span>
        )}
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center text-[10px] text-transparent group-hover:text-white uppercase tracking-wide">
          {uploading ? 'Uploading…' : 'Change'}
        </span>
      </button>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="ov-outlined-btn-lp px-4 py-2 text-sm disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : shown ? 'Change photo' : 'Add a photo'}
        </button>
        <p className="text-[11px] text-lp-slate mt-1.5">Optional — a face or logo helps clients pick you.</p>
        {error && <p className="text-xs text-lp-bad mt-1.5">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
