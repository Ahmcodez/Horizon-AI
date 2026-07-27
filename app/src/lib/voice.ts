import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Voice input/output for the AI assistant, using the browser's built-in
 * Web Speech API - no server involved, no extra dependency. Support varies
 * by browser (solid in Chrome/Edge, partial in Safari, absent in Firefox),
 * so everything here feature-detects and degrades to "just don't show the
 * voice controls" rather than erroring.
 */

// The Web Speech API's SpeechRecognition isn't in TypeScript's standard DOM
// types yet, so we declare the minimal shape we actually use.
interface MinimalSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

interface UseSpeechRecognitionResult {
  supported: boolean
  listening: boolean
  start: () => void
  stop: () => void
}

/**
 * Voice-to-text. onResult fires with the final transcribed text once the
 * user stops speaking - this deliberately doesn't stream interim partial
 * results into the input, to avoid a jittery typing effect.
 */
export function useSpeechRecognition(onResult: (text: string) => void): UseSpeechRecognitionResult {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const supported = isSpeechRecognitionSupported()

  useEffect(() => {
    if (!supported) return
    const Ctor = getSpeechRecognitionCtor()!
    const recognition = new Ctor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript ?? ''
      if (text) onResult(text)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    return () => recognition.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported])

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return
    setListening(true)
    recognitionRef.current.start()
  }, [listening])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { supported, listening, start, stop }
}

/** Text-to-speech. Cancels any in-progress speech before starting new speech. */
export function speak(text: string): void {
  if (!isSpeechSynthesisSupported() || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95 // slightly slower than default - easier to follow for the target audience
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
}
