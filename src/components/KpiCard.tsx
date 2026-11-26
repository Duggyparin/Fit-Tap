// A headline number, e.g. "Active members 11".
export default function KpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-3 lg:p-5">
      <p className="text-xs text-ink-muted lg:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy lg:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
