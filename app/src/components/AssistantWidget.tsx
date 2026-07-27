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
      // Voice input auto-sends - unlike the "explain" pre-fill buttons,
      // this is the user's own spoken words, not a suggested question.
      send(transcript)
    })
  const ttsSupported = isSpeechSynthesisSupported()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  // Read the latest assistant reply aloud, if auto-speak is on.
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
    // Stop any speech in progress when the panel closes.
    if (!isOpen) stopSpeaking()
  }, [isOpen])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send(draftQuestion)
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-chalk border border-graphite/10 rounded-3xl shadow-lg overflow-hidden flex flex-col animate-[fadeUp_0.3s_ease]">
          <div className="bg-graphite text-chalk px-5 py-4 flex items-center justify-between">
            <div>
              <div className="font-display text-base font-medium">Ask Horizon</div>
              <div className="text-xs text-chalk/50 font-mono">Grounded in your saved numbers</div>
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
              <button onClick={close} className="text-chalk/60 hover:text-chalk transition-colors text-xl leading-none">
                ×
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[360px] min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-sm text-slate text-center py-8 px-4">
                Ask anything about your claiming options — e.g. "Should I claim now or wait two
                years?"{micSupported ? ' Tap the mic to speak instead of typing.' : ''}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amber text-graphite font-medium ml-auto'
                    : 'bg-chalk-dim text-graphite'
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="bg-chalk-dim text-slate text-sm px-4 py-2.5 rounded-2xl max-w-[70%] font-mono">
                Thinking…
              </div>
            )}
            {error && <div className="text-xs text-warn text-center">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-graphite/10 p-3 flex gap-2">
            {micSupported && (
              <button
                type="button"
                onClick={() => (listening ? stopListening() : startListening())}
                aria-label={listening ? 'Stop voice input' : 'Ask by voice'}
                aria-pressed={listening}
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  listening ? 'bg-warn text-white animate-pulse' : 'bg-chalk-dim text-graphite hover:bg-amber'
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
              className="flex-1 bg-chalk-dim rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-deep/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !draftQuestion.trim()}
              className="bg-graphite text-chalk rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-amber hover:text-graphite transition-colors"
            >
              Send
            </button>
          </form>

          <p className="text-[10px] text-slate text-center pb-3 px-4 leading-relaxed">
            Informational only — not financial, legal, or tax advice.
          </p>
        </div>
      )}

      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber text-graphite shadow-amber flex items-center justify-center text-2xl font-semibold hover:-translate-y-0.5 transition-transform"
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </>
  )
}
