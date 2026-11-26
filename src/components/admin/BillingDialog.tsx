import { useState, type FormEvent } from 'react'
import { setBilling } from '../../lib/adminData'
import { discountError, type Billing } from '../../lib/billing'
import { formatPeso } from '../../lib/format'
import { cyclePrice } from '../../lib/platform'
import { useOnline } from '../../lib/useOnline'
import type { Gym } from '../../types'
import Button from '../Button'
import Modal from '../Modal'
import BillingFields from './BillingFields'

export default function BillingDialog({ gym, onClose }: { gym: Gym; onClose: () => void }) {
  const online = useOnline()
  const [billing, setValue] = useState<Billing>({
    cycle: gym.billing_cycle,
    discount: String(gym.annual_discount_percent),
  })
  const [tried, setTried] = useState(false)
  const error = discountError(billing)
  const percent = Number(billing.discount)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (error) return setTried(true)
    // Keep the old discount if a monthly gym left the field unused.
    setBilling(
      gym.gym_id,
      billing.cycle,
      billing.cycle === 'annual' ? percent : gym.annual_discount_percent,
    )
    onClose()
  }

  return (
    <Modal title="Billing cycle" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <BillingFields value={billing} onChange={setValue} error={tried ? error : null} />
        {!error && (
          <p className="text-sm font-semibold">
            Next payment:{' '}
            {formatPeso(
              cyclePrice({
                billing_cycle: billing.cycle,
                monthly_fee_centavos: gym.monthly_fee_centavos,
                annual_discount_percent: billing.cycle === 'annual' ? percent : 0,
              }),
            )}{' '}
            per {billing.cycle === 'annual' ? 'year' : 'month'}
          </p>
        )}
        <p className="text-sm text-ink-muted">The next due date does not change.</p>
        <Button type="submit" disabled={!online}>
          Save billing
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </form>
    </Modal>
  )
}
