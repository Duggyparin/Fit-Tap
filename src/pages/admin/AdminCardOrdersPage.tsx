import { Package, Plus } from 'lucide-react'
import { useState } from 'react'
import RegisterBatchDialog from '../../components/admin/RegisterBatchDialog'
import BatchCard from '../../components/BatchCard'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'
import SelectField from '../../components/SelectField'
import { setBatchStatus, useAdminBatches } from '../../lib/adminData'
import { BATCH_STATUS } from '../../lib/status'
import { useOnline } from '../../lib/useOnline'
import type { CardBatchStatus } from '../../types'

const STATUS_OPTIONS = (['ordered', 'printing', 'shipped', 'received'] as const).map((value) => ({
  value,
  label: BATCH_STATUS[value].label,
}))

export default function AdminCardOrdersPage() {
  const batches = useAdminBatches().data
  const online = useOnline()
  const [registering, setRegistering] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Card orders"
        subtitle="Orders from all gyms"
        action={
          <Button icon={Plus} onClick={() => setRegistering(true)}>
            Register batch
          </Button>
        }
      />
      {batches.length === 0 ? (
        <EmptyState icon={Package} title="No card orders yet" text="Orders appear here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {batches.map((b) => (
            <BatchCard key={b.batch.batch_id} counts={b} gymName={b.gymName} showPrice>
              <div className="mt-3 border-t border-line pt-3 lg:max-w-xs">
                <SelectField
                  label="Change status"
                  value={b.batch.status}
                  disabled={!online}
                  onChange={(e) =>
                    setBatchStatus(b.batch.batch_id, e.target.value as CardBatchStatus)
                  }
                  options={STATUS_OPTIONS}
                />
              </div>
            </BatchCard>
          ))}
        </ul>
      )}
      {registering && <RegisterBatchDialog onClose={() => setRegistering(false)} />}
    </div>
  )
}
