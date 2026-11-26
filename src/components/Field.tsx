import { useId, type InputHTMLAttributes } from 'react'

// A labelled text input with an optional hint and error message.
export default function Field({
  label,
  optional = false,
  hint,
  error,
  prefix,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  optional?: boolean
  hint?: string
  error?: string | null
  prefix?: string // e.g. "₱"
}) {
  const id = useId()
  const note = error ?? hint

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      <div
        className={`flex min-h-12 items-center gap-2 rounded-lg border bg-card px-3 focus-within:border-primary ${
          error ? 'border-danger' : 'border-line'
        }`}
      >
        {prefix && <span className="font-semibold text-ink-muted">{prefix}</span>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? `${id}-note` : undefined}
          // 16px text stops iPhones from zooming in when the field is tapped.
          className="w-full min-w-0 bg-transparent text-base outline-none"
          {...input}
        />
      </div>
      {note && (
        <p id={`${id}-note`} className={`text-sm ${error ? 'font-medium' : 'text-ink-muted'}`}>
          {error && <span aria-hidden="true">⚠ </span>}
          {note}
        </p>
      )}
    </div>
  )
}
