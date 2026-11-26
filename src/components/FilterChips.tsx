// A row of choices where exactly one is selected.
export default function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string // read by screen readers
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
              selected
                ? 'border-primary bg-primary text-card'
                : 'border-line bg-card text-ink hover:border-primary'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
