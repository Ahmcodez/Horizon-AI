import { useState, type FormEvent } from 'react'
import { ADVISOR_SPECIALTIES } from '../lib/advisorSpecialties'

/**
 * Multi-select "gig tags" picker: predefined specialties as toggleable chips,
 * plus a text field to add anything not on the list. Selected state lives
 * entirely in `value` - this is a controlled component, same pattern as a
 * plain text input.
 */
export default function SpecialtyPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [customText, setCustomText] = useState('')

  // Anything in `value` that isn't one of the predefined options is a custom
  // tag the advisor typed in themselves - still rendered as a chip so it can
  // be removed the same way.
  const customSelected = value.filter((v) => !ADVISOR_SPECIALTIES.includes(v))
  const chips = [...ADVISOR_SPECIALTIES, ...customSelected]

  function toggle(spec: string) {
    if (value.includes(spec)) onChange(value.filter((v) => v !== spec))
    else onChange([...value, spec])
  }

  function handleAddCustom(e: FormEvent) {
    e.preventDefault()
    const trimmed = customText.trim()
    if (!trimmed) return
    if (!value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed])
    }
    setCustomText('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map((spec) => {
          const selected = value.includes(spec)
          return (
            <button
              type="button"
              key={spec}
              onClick={() => toggle(spec)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selected
                  ? 'bg-lp-graphite border-lp-graphite text-lp-chalk'
                  : 'bg-lp-chalk border-lp-line-strong text-lp-slate hover:border-lp-graphite hover:text-lp-graphite'
              }`}
            >
              {spec}
              {selected && <span className="ml-1.5">×</span>}
            </button>
          )
        })}
      </div>
      <form onSubmit={handleAddCustom} className="flex gap-2">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Add your own specialty…"
          className="flex-1 bg-lp-chalk border border-lp-line-strong rounded-[5px] px-3 py-2 text-sm focus:border-[var(--color-lp-cyan)] outline-none text-lp-graphite"
        />
        <button
          type="submit"
          disabled={!customText.trim()}
          className="ov-outlined-btn-lp px-4 py-2 text-sm disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  )
}
