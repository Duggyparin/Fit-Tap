import { CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import Icon from './Icon'

// "It worked" message with the next actions underneath.
export default function SuccessPanel({
  title,
  detail,
  children,
}: {
  title: string
  detail: string
  children?: ReactNode // buttons
}) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
      <Icon icon={CircleCheck} size={56} className="text-success" />
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-ink-muted">{detail}</p>
      {children && <div className="mt-3 flex w-full flex-col gap-2">{children}</div>}
    </div>
  )
}
