import { useEffect, useRef } from 'react'

/**
 * Attaches the .reveal / .in scroll-animation pattern (defined in index.css)
 * to an element via IntersectionObserver. Returns a ref to attach to the
 * element you want to fade/slide in as it enters the viewport.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
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
    return () => observer.disconnect()
  }, [])

  return ref
}
