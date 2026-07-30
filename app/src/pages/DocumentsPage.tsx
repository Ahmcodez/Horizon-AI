import { useRef, useState, type DragEvent } from 'react'
import { readDocument, ACCEPTED_TYPES, MAX_FILE_BYTES } from '../lib/documentReader'
import UpgradeGate from '../components/UpgradeGate'

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setError(null)
    setSummary(null)
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported file type — please upload a JPEG, PNG, or PDF.')
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setError('File is too large — please use a file under 6MB.')
      return
    }
    setFile(f)
    setPreviewUrl(f.type === 'application/pdf' ? null : URL.createObjectURL(f))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) handleFile(dropped)
  }

  async function analyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await readDocument(file)
      setSummary(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setPreviewUrl(null)
    setSummary(null)
    setError(null)
  }

  return (
    <main
      style={{ fontFamily: 'var(--font-luxe)' }}
      className="max-w-3xl mx-auto px-8 pt-32 pb-24 bg-paper-dim min-h-screen"
    >
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-azure font-semibold mb-5">
          <span className="w-4 h-[1.5px] bg-azure" />
          Document reader
        </div>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-ink">
          Upload the letter. Get the plain-English version.
        </h1>
        <p className="mt-4 text-muted text-lg leading-relaxed">
          Photograph or scan an SSA, IRS, or Medicare notice — we'll tell you what it says and
          whether you need to do anything about it.
        </p>
      </div>

      <UpgradeGate feature="Document reader">
        {!file && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all ${
              dragOver ? 'border-azure bg-azure/5 scale-[1.01]' : 'border-ink/15 bg-paper hover:border-ink/30'
            }`}
          >
            <div className="text-4xl mb-4">📄</div>
            <p className="font-medium text-ink mb-1">Drop a file here, or click to browse</p>
            <p className="text-sm text-muted">JPEG, PNG, or PDF — up to 6MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </div>
        )}

      {file && (
        <div className="space-y-6" style={{ animation: 'fadeUp 0.4s cubic-bezier(.16,.8,.24,1)' }}>
          <div className="bg-paper border border-ink/8 rounded-3xl p-6 shadow-card-light flex items-center gap-5">
            {previewUrl ? (
              <img src={previewUrl} alt="Document preview" className="w-20 h-20 object-cover rounded-xl border border-ink/8" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-obsidian text-paper flex items-center justify-center font-mono text-xs">
                PDF
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-ink">{file.name}</div>
              <div className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <button onClick={reset} className="text-sm text-muted hover:text-red-500 transition-colors">
              Remove
            </button>
          </div>

          {!summary && (
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full bg-obsidian text-paper font-semibold py-3.5 rounded-full shadow-card-dark hover:bg-gold hover:text-obsidian hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? 'Reading document…' : 'Analyze this document'}
            </button>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-5 py-4">{error}</div>}

          {summary && (
            <div
              className="bg-obsidian-elevated text-paper rounded-3xl p-8 shadow-card-dark"
              style={{ animation: 'fadeUp 0.5s cubic-bezier(.16,.8,.24,1)' }}
            >
              <div className="text-xs font-mono uppercase tracking-wide text-azure mb-4">
                What this document says
              </div>
              <div className="leading-relaxed whitespace-pre-line">{summary}</div>
              <button
                onClick={reset}
                className="mt-6 text-sm font-semibold text-paper/70 hover:text-gold transition-colors"
              >
                ← Analyze another document
              </button>
            </div>
          )}

          <p className="text-xs text-muted leading-relaxed">
            Informational only — not financial, legal, or tax advice. If a document requests
            action, confirm directly with SSA.gov, the IRS, or Medicare before responding.
          </p>
        </div>
      )}
      </UpgradeGate>
    </main>
  )
}
