import { useCallback, useRef } from 'react'

/**
 * Attaches the .reveal / .in scroll-animation pattern (defined in index.css)
 * to an element via IntersectionObserver. Returns a ref to attach to the
 * element you want to fade/slide in as it enters the viewport.
 *
 * Deliberately a callback ref, not a useRef + mount-once useEffect: a plain
 * useEffect with an empty dependency array only runs once, when the
 * component itself first mounts - if the .reveal element is behind a
 * conditional (e.g. an async profile load, like ScenariosPage/BillingPage/
 * TaxMedicarePage all have), it doesn't exist in the DOM yet at that point,
 * so the observer never attaches and the element is stuck at the .reveal
 * default of opacity:0 forever. A callback ref fires whenever React
 * actually attaches or detaches the node, whenever that happens to be.
 */
export function useReveal<T extends HTMLElement>() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ref = useCallback((el: T | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    observerRef.current = observer
  }, [])

  return ref
}
