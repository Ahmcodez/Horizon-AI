import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAssistant } from '../lib/assistantContext'
import {
  useSpeechRecognition,
  isSpeechSynthesisSupported,
  speak,
  stopSpeaking,
} from '../lib/voice'

export default function AssistantWidget() {
  const { isOpen, messages, draftQuestion, sending, error, toggle, close, setDraftQuestion, send } =
    useAssistant()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const lastSpokenIndex = useRef(-1)

  const { supported: micSupported, listening, start: startListening, stop: stopListening } =
    useSpeechRecognition((transcript) => {
      send(transcript)
    })
  const ttsSupported = isSpeechSynthesisSupported()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    if (!autoSpeak || messages.length === 0) return
    const lastIndex = messages.length - 1
    const last = messages[lastIndex]
    if (last.role === 'assistant' && lastIndex !== lastSpokenIndex.current) {
      speak(last.text)
      lastSpokenIndex.current = lastIndex
    }
  }, [messages, autoSpeak])

  useEffect(() => {
    if (!isOpen) stopSpeaking()
  }, [isOpen])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send(draftQuestion)
  }

  return (
    <div style={{ fontFamily: 'var(--font-luxe)' }}>
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-paper border border-ink/8 rounded-3xl shadow-card-light overflow-hidden flex flex-col"
          style={{ animation: 'fadeUp 0.3s cubic-bezier(.16,.8,.24,1)' }}
        >
          <div className="bg-obsidian text-paper px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Ask Horizon</div>
              <div className="text-xs text-azure font-mono">Grounded in your saved numbers</div>
            </div>
            <div className="flex items-center gap-3">
              {ttsSupported && (
                <button
                  onClick={() => {
                    setAutoSpeak((v) => !v)
                    if (autoSpeak) stopSpeaking()
                  }}
                  aria-label={autoSpeak ? 'Turn off read-aloud' : 'Turn on read-aloud'}
                  aria-pressed={autoSpeak}
                  className={`text-lg leading-none transition-opacity ${autoSpeak ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                >
                  {autoSpeak ? '🔊' : '🔈'}
                </button>
              )}
              <button onClick={close} className="text-paper/60 hover:text-paper transition-colors text-xl leading-none">
                ×
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[360px] min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-sm text-muted text-center py-8 px-4">
                Ask anything about your claiming options — e.g. "Should I claim now or wait two
                years?"{micSupported ? ' Tap the mic to speak instead of typing.' : ''}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{ animation: 'fadeUp 0.25s cubic-bezier(.16,.8,.24,1)' }}
                className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-paper-dim border border-ink/10 text-ink font-medium ml-auto'
                    : 'bg-azure/10 border border-azure/20 text-ink'
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="bg-paper-dim text-muted text-sm px-4 py-2.5 rounded-2xl max-w-[70%] font-mono">
                Thinking…
              </div>
            )}
            {error && <div className="text-xs text-red-500 text-center">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-ink/8 p-3 flex gap-2">
            {micSupported && (
              <button
                type="button"
                onClick={() => (listening ? stopListening() : startListening())}
                aria-label={listening ? 'Stop voice input' : 'Ask by voice'}
                aria-pressed={listening}
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  listening ? 'bg-red-500 text-white animate-pulse' : 'bg-paper-dim text-ink hover:bg-azure/15'
                }`}
              >
                🎙️
              </button>
            )}
            <input
              type="text"
              value={draftQuestion}
              onChange={(e) => setDraftQuestion(e.target.value)}
              placeholder={listening ? 'Listening…' : 'Ask a question…'}
              disabled={listening}
              className="flex-1 bg-paper-dim rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-azure/30 disabled:opacity-60 text-ink"
            />
            <button
              type="submit"
              disabled={sending || !draftQuestion.trim()}
              className="bg-obsidian text-paper rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-azure transition-colors"
            >
              Send
            </button>
          </form>

          <p className="text-[10px] text-muted text-center pb-3 px-4 leading-relaxed">
            Informational only — not financial, legal, or tax advice.
          </p>
        </div>
      )}

      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-azure text-paper shadow-glow-azure flex items-center justify-center text-2xl font-semibold hover:-translate-y-0.5 transition-transform"
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  )
}
