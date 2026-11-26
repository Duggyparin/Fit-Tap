import { useId, type ReactNode } from 'react'

// A titled white box used on the Dashboard and Reports.
export default function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode // e.g. a "View all" link
  children: ReactNode
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-xl border border-line bg-card">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-line px-4">
        <h2 id={id} className="font-bold text-navy">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  )
}
