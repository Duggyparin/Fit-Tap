import { Package, Plus } from 'lucide-react'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useCardBatches, useCurrentUser } from '../lib/data'
import { formatDate, formatPeso } from '../lib/format'
import { BATCH_STATUS } from '../lib/status'

export default function CardOrdersPage() {
  const batches = useCardBatches().data
  const isOwner = useCurrentUser().data.role === 'owner'

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Card orders"
        subtitle="Branded card batches. Registering a batch comes later."
        action={
          <Button icon={Plus} disabled>
            Register batch
          </Button>
        }
      />
      {batches.length === 0 ? (
        <EmptyState icon={Package} title="No card orders yet" text="Ordered batches appear here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {batches.map(({ batch, registered, inStock, linked, blocked }) => (
            <li key={batch.batch_id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {batch.quantity} cards · {batch.chip_type}
                  </p>
                  <p className="text-sm text-ink-muted">
                    Ordered {formatDate(batch.ordered_at)}
                    {isOwner && ` · ${formatPeso(batch.price_centavos)}`}
                  </p>
                </div>
                <StatusBadge {...BATCH_STATUS[batch.status]} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
                {[
                  ['Registered', registered],
                  ['In stock', inStock],
                  ['Linked', linked],
                  ['Lost or disabled', blocked],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="text-xl font-bold text-navy">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
