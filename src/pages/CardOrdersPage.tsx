import { Package } from 'lucide-react'
import BatchCard from '../components/BatchCard'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useCardBatches, useIsOwner } from '../lib/data'

// Gym owners only follow their orders; FitTap registers and updates them.
export default function CardOrdersPage() {
  const batches = useCardBatches().data
  const isOwner = useIsOwner()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader title="Card orders" subtitle="Your branded card orders and their status" />
      {batches.length === 0 ? (
        <EmptyState icon={Package} title="No card orders yet" text="Your orders appear here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {batches.map((counts) => (
            <BatchCard key={counts.batch.batch_id} counts={counts} showPrice={isOwner} />
          ))}
        </ul>
      )}
    </div>
  )
}
