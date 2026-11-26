import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import Icon from './Icon'

// What a list shows when it has nothing in it.
export default function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon
  title: string
  text: string
  action?: ReactNode // usually a <Button>
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-line bg-card px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-page text-ink-muted">
        <Icon icon={icon} size={28} />
      </span>
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
