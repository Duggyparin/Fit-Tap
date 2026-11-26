import type { ReactNode } from 'react'

// Temporary page body used until each screen is built.
export default function PagePlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-navy">{title}</h1>
      <p className="mt-1 text-sm text-ink-muted">This screen is not built yet.</p>
      {children}
    </section>
  )
}
