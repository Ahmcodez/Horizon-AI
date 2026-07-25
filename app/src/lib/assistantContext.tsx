import { createContext, useContext, useState, type ReactNode } from 'react'
import { askAssistant, type AssistantContext as GroundingContext } from './assistant'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface AssistantState {
  isOpen: boolean
  messages: ChatMessage[]
  draftQuestion: string
  sending: boolean
  error: string | null
  open: () => void
  close: () => void
  toggle: () => void
  setDraftQuestion: (text: string) => void
  setGroundingContext: (ctx: GroundingContext) => void
  send: (question: string) => Promise<void>
}

const AssistantStateContext = createContext<AssistantState | undefined>(undefined)

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draftQuestion, setDraftQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groundingContext, setGroundingContext] = useState<GroundingContext | null>(null)

  async function send(question: string) {
    const trimmed = question.trim()
    if (!trimmed || !groundingContext || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setDraftQuestion('')
    setSending(true)
    setError(null)

    try {
      const answer = await askAssistant(trimmed, groundingContext)
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }])
    } catch (err) {
      setError('The assistant is temporarily unavailable — please try again.')
    } finally {
      setSending(false)
    }
  }

  const value: AssistantState = {
    isOpen,
    messages,
    draftQuestion,
    sending,
    error,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
    setDraftQuestion,
    setGroundingContext,
    send,
  }

  return <AssistantStateContext.Provider value={value}>{children}</AssistantStateContext.Provider>
}

export function useAssistant(): AssistantState {
  const ctx = useContext(AssistantStateContext)
  if (!ctx) throw new Error('useAssistant must be used within an AssistantProvider')
  return ctx
}
