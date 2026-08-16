import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { askAssistant, type AssistantContext as GroundingContext } from './assistant'
import { useAuth } from './authContext'
import { getProfile } from './profileStore'
import { generateClaimingComparison, getFullRetirementAge, calculateBreakevenAge } from './socialSecurity'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  inScope?: boolean
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
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draftQuestion, setDraftQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groundingContext, setGroundingContext] = useState<GroundingContext | null>(null)

  // The assistant widget is mounted globally (App.tsx), but grounding
  // numbers were previously only ever pushed in by CalculatorPage - so
  // opening the assistant from any other page (Scenarios, Documents,
  // Billing, ...) left groundingContext permanently null and every send()
  // silently no-op'd (the Send button appeared to do nothing). Loading a
  // default straight from the saved profile here means the assistant
  // works from any page. CalculatorPage still calls setGroundingContext
  // itself to override this with live, unsaved edits while the user is
  // actively adjusting numbers there.
  useEffect(() => {
    if (!user) {
      setGroundingContext(null)
      return
    }
    let cancelled = false
    getProfile(user.uid)
      .then((profile) => {
        if (cancelled) return
        const fra = getFullRetirementAge(profile.birthYear)
        const comparison = generateClaimingComparison(profile.pia, profile.birthYear)
        const breakeven = calculateBreakevenAge(profile.pia, profile.birthYear, 62, 70)
        setGroundingContext({
          birthYear: profile.birthYear,
          pia: profile.pia,
          fullRetirementAge: fra.months > 0 ? `${fra.years} years, ${fra.months} months` : `${fra.years}`,
          comparison: comparison.map((c) => ({ age: c.age, monthlyBenefit: c.monthlyBenefit })),
          breakevenAge: breakeven,
        })
      })
      .catch((err) => {
        console.error('AssistantProvider: failed to load a default grounding context:', err)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  async function send(question: string) {
    const trimmed = question.trim()
    if (!trimmed || !groundingContext || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setDraftQuestion('')
    setSending(true)
    setError(null)

    try {
      const { answer, inScope } = await askAssistant(trimmed, groundingContext)
      setMessages((prev) => [...prev, { role: 'assistant', text: answer, inScope }])
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
