import { Search } from 'lucide-react'
import Icon from './Icon'

export default function SearchInput({
  label,
  value,
  onChange,
  placeholder,
  autoFocus = false,
}: {
  label: string // read by screen readers
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoFocus?: boolean // only works inside a <Modal>
}) {
  return (
    <label className="flex min-h-12 items-center gap-2 rounded-lg border border-line bg-card px-3 text-ink-muted focus-within:border-primary">
      <Icon icon={Search} size={18} />
      <input
        type="search"
        aria-label={label}
        data-autofocus={autoFocus || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // 16px text stops iPhones from zooming in when the field is tapped.
        className="w-full bg-transparent text-base text-ink outline-none"
      />
    </label>
  )
}
