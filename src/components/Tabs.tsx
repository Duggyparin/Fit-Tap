import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface Tab {
  label: string
  content: ReactNode
}

// Tabs that also work with the left and right arrow keys.
export default function Tabs({ label, tabs }: { label: string; tabs: Tab[] }) {
  const [selected, setSelected] = useState(0)
  const id = useId()

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (selected + step + tabs.length) % tabs.length
    setSelected(next)
    event.currentTarget.querySelectorAll('button')[next].focus()
  }

  return (
    <div className="rounded-xl border border-line bg-card">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex border-b border-line px-2"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === selected}
            aria-controls={`${id}-panel`}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => setSelected(i)}
            className={`min-h-12 flex-1 border-b-2 px-2 text-sm font-semibold lg:flex-none lg:px-4 ${
              i === selected
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${selected}`}>
        {tabs[selected].content}
      </div>
    </div>
  )
}
