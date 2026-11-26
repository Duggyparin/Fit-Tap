import type { ReactNode } from 'react'
import type { BatchCounts } from '../lib/batches'
import { formatDate, formatPeso } from '../lib/format'
import { BATCH_STATUS } from '../lib/status'
import StatusBadge from './StatusBadge'

// One card order, shown to gym owners and to the platform admin.
export default function BatchCard({
  counts,
  gymName,
  showPrice,
  children,
}: {
  counts: BatchCounts
  gymName?: string
  showPrice: boolean
  children?: ReactNode // admin controls
}) {
  const { batch, registered, inStock, linked, blocked } = counts
  return (
    <li className="rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {gymName && <p className="text-sm font-semibold">{gymName}</p>}
          <p className="font-semibold">
            {batch.quantity} cards · {batch.chip_type}
          </p>
          <p className="text-sm text-ink-muted">
            Ordered {formatDate(batch.ordered_at)}
            {showPrice && batch.price_centavos > 0 && ` · ${formatPeso(batch.price_centavos)}`}
          </p>
        </div>
        <StatusBadge {...BATCH_STATUS[batch.status]} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        {(
          [
            ['Registered', registered],
            ['In stock', inStock],
            ['Linked', linked],
            ['Lost or disabled', blocked],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-xl font-bold text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </li>
  )
}
