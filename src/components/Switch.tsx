// An on/off control. The words say the state, so color is not the only signal.
export default function Switch({
  checked,
  onChange,
  label,
  onText,
  offText,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string // read by screen readers, e.g. "Monthly plan is active"
  onText: string
  offText: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={`flex h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
          checked ? 'justify-end bg-primary' : 'justify-start bg-line'
        }`}
      >
        <span className="size-5 rounded-full bg-card shadow" />
      </span>
      <span className="w-14 text-left">{checked ? onText : offText}</span>
    </button>
  )
}
