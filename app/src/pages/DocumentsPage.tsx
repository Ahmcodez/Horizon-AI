import { useEffect, useRef, useState, type DragEvent } from 'react'
import { readDocument, ACCEPTED_TYPES, MAX_FILE_BYTES } from '../lib/documentReader'
import UpgradeGate from '../components/UpgradeGate'

export default function DocumentsPage() {
  useEffect(() => {
    document.title = 'Document Reader — Understand SSA, IRS & Medicare Letters | Horizon'
  }, [])

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
      style={{ fontFamily: 'var(--font-vivid)' }}
      className="max-w-3xl mx-auto px-8 pt-32 pb-24 bg-vivid-obsidian min-h-screen"
    >
      <div className="mb-10">
        <div className="text-[14px] uppercase tracking-[0.02em] text-fog-blue mb-5 flex items-center gap-2">
          <span className="w-4 h-[1.5px] bg-fog-blue" />
          Document reader
        </div>
        <h1 className="text-heading-sm font-normal tracking-tight leading-tight text-bone-white">
          Upload the letter. Get the plain-English version.
        </h1>
        <p className="mt-4 text-fog-blue text-lg leading-relaxed">
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
            className={`border-2 border-dashed rounded-[15px] p-16 text-center cursor-pointer transition-all vivid-ease ${
              dragOver ? 'border-bone-white bg-graphite-veil/20 scale-[1.01]' : 'border-ash-border bg-graphite-veil/10 hover:border-bone-white/40'
            }`}
          >
            <div className="text-4xl mb-4">📄</div>
            <p className="font-normal text-bone-white mb-1">Drop a file here, or click to browse</p>
            <p className="text-sm text-fog-blue">JPEG, PNG, or PDF — up to 6MB</p>
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
          <div className="hover-glow-white bg-graphite-veil/20 border border-ash-border rounded-[15px] p-6 flex items-center gap-5">
            {previewUrl ? (
              <img src={previewUrl} alt="Document preview" className="w-20 h-20 object-cover rounded-[5px] border border-ash-border" />
            ) : (
              <div className="w-20 h-20 rounded-[5px] bg-vivid-obsidian border border-ash-border text-bone-white flex items-center justify-center font-mono text-xs">
                PDF
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-normal truncate text-bone-white">{file.name}</div>
              <div className="text-xs text-fog-blue">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <button onClick={reset} className="text-sm text-fog-blue hover:text-bone-white transition-colors">
              Remove
            </button>
          </div>

          {!summary && (
            <button
              onClick={analyze}
              disabled={loading}
              className="ov-outlined-btn w-full py-3.5"
            >
              {loading ? 'Reading document…' : 'Analyze this document'}
            </button>
          )}

          {error && <div className="text-sm text-bone-white bg-vivid-obsidian border border-bone-white/40 rounded-[5px] px-5 py-4">{error}</div>}

          {summary && (
            <div
              className="hover-glow-white bg-graphite-veil/30 border border-ash-border text-bone-white rounded-[15px] p-8"
              style={{ animation: 'fadeUp 0.5s cubic-bezier(.16,.8,.24,1)' }}
            >
              <div className="text-[13px] uppercase tracking-[0.02em] text-fog-blue mb-4">
                What this document says
              </div>
              <div className="leading-relaxed whitespace-pre-line">{summary}</div>
              <button
                onClick={reset}
                className="mt-6 text-sm font-normal text-fog-blue hover:text-bone-white transition-colors"
              >
                ← Analyze another document
              </button>
            </div>
          )}

          <p className="text-xs text-fog-blue leading-relaxed">
            Informational only — not financial, legal, or tax advice. If a document requests
            action, confirm directly with SSA.gov, the IRS, or Medicare before responding.
          </p>
        </div>
      )}
      </UpgradeGate>
    </main>
  )
}
