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
    <div style={{ fontFamily: 'var(--font-vivid)' }}>
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-graphite-veil/20 border border-ash-border rounded-[15px] overflow-hidden flex flex-col"
          style={{ animation: 'fadeUp 0.3s cubic-bezier(.16,.8,.24,1)' }}
        >
          <div className="bg-vivid-obsidian text-bone-white px-5 py-4 flex items-center justify-between border-b border-ash-border">
            <div>
              <div className="text-base font-normal">Ask Horizon</div>
              <div className="text-xs text-fog-blue font-mono">Grounded in your saved numbers</div>
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
              <button onClick={close} className="text-bone-white/60 hover:text-bone-white transition-colors text-xl leading-none">
                ×
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[360px] min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-sm text-fog-blue text-center py-8 px-4">
                Ask anything about your Social Security claiming options, spousal/survivor
                benefits, or Medicare and tax numbers — e.g. "Should I claim now or wait two
                years?"{micSupported ? ' Tap the mic to speak instead of typing.' : ''}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  style={{ animation: 'fadeUp 0.25s cubic-bezier(.16,.8,.24,1)' }}
                  className={`text-sm px-4 py-2.5 rounded-[10px] max-w-[85%] leading-relaxed border ${
                    m.role === 'user'
                      ? 'bg-muted-grey/40 border-ash-border text-bone-white ml-auto'
                      : m.inScope === false
                        ? 'bg-vivid-obsidian border-ash-border border-dashed text-fog-blue'
                        : 'bg-graphite-veil/25 border-ash-border text-bone-white'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="bg-graphite-veil/20 border border-ash-border text-fog-blue text-sm px-4 py-2.5 rounded-[10px] max-w-[70%] font-mono">
                Thinking…
              </div>
            )}
            {error && <div className="text-xs text-bone-white text-center">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-ash-border p-3 flex gap-2">
            {micSupported && (
              <button
                type="button"
                onClick={() => (listening ? stopListening() : startListening())}
                aria-label={listening ? 'Stop voice input' : 'Ask by voice'}
                aria-pressed={listening}
                className={`w-9 h-9 rounded-[5px] flex items-center justify-center flex-shrink-0 transition-colors border ${
                  listening ? 'bg-bone-white text-vivid-obsidian border-bone-white animate-pulse' : 'bg-vivid-obsidian border-ash-border text-bone-white hover:border-bone-white'
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
              className="flex-1 bg-vivid-obsidian border border-ash-border rounded-[5px] px-4 py-2.5 text-sm outline-none focus:border-bone-white disabled:opacity-60 text-bone-white"
            />
            <button
              type="submit"
              disabled={sending || !draftQuestion.trim()}
              className="ov-outlined-btn"
            >
              Send
            </button>
          </form>

          <p className="text-[10px] text-fog-blue text-center pb-3 px-4 leading-relaxed">
            Informational only — not financial, legal, or tax advice.
          </p>
        </div>
      )}

      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-vivid-obsidian border-2 border-bone-white text-bone-white flex items-center justify-center text-2xl font-normal hover:bg-graphite-veil/30 transition-colors"
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  )
}
