import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        aria-label="Primary"
        className={`flex items-center justify-between px-8 transition-all duration-300 backdrop-blur-md border-b border-graphite/10 ${
          scrolled ? 'py-3 shadow-md bg-chalk/95' : 'py-4 bg-chalk/80'
        }`}
      >
        <a href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <span className="w-[18px] h-[18px] bg-amber rounded-[5px_5px_5px_0] shadow-[0_2px_8px_rgba(232,163,61,0.5)]" />
          Horizon
        </a>
        <ul className="hidden md:flex items-center gap-1 text-sm font-medium">
          <li>
            <a href="#calculator" className="px-4 py-2 rounded-lg text-slate hover:text-graphite hover:bg-chalk-dim transition-colors">
              Calculator
            </a>
          </li>
          <li>
            <a href="/documents" className="px-4 py-2 rounded-lg text-slate hover:text-graphite hover:bg-chalk-dim transition-colors">
              Documents
            </a>
          </li>
          <li>
            <a href="#results" className="px-4 py-2 rounded-lg text-slate hover:text-graphite hover:bg-chalk-dim transition-colors">
              Results
            </a>
          </li>
        </ul>
        <a
          href="#calculator"
          className="bg-graphite text-chalk px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-amber hover:text-graphite hover:-translate-y-0.5 transition-all"
        >
          Get your number
        </a>
      </nav>
    </header>
  )
}
