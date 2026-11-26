import { useState, type FormEvent } from 'react'
import { savePlan, usePlans } from '../lib/data'
import { parsePesos } from '../lib/payments'
import { useOnline } from '../lib/useOnline'
import type { Plan } from '../types'
import Button from './Button'
import Field from './Field'
import Modal from './Modal'

// Add a plan, or edit the one passed in.
export default function PlanDialog({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const online = useOnline()
  const plans = usePlans().data
  const [name, setName] = useState(plan?.plan_name ?? '')
  const [days, setDays] = useState(plan ? String(plan.duration_days) : '')
  const [price, setPrice] = useState(plan ? String(plan.price_centavos / 100) : '')
  const [tried, setTried] = useState(false)

  const durationDays = /^\d+$/.test(days.trim()) ? Number(days) : 0
  const priceCentavos = parsePesos(price)
  const duplicate = plans.some(
    (p) =>
      p.plan_id !== plan?.plan_id &&
      p.plan_name.toLowerCase() === name.trim().toLowerCase(),
  )
  const errors = {
    name: !name.trim()
      ? 'Enter a plan name.'
      : duplicate
        ? 'Another plan already has this name.'
        : null,
    days: durationDays < 1 || durationDays > 3650 ? 'Enter whole days, from 1 to 3650.' : null,
    price: priceCentavos === null ? 'Enter a price above zero.' : null,
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (errors.name || errors.days || errors.price) return setTried(true)
    savePlan({ name, durationDays, priceCentavos: priceCentavos! }, plan?.plan_id)
    onClose()
  }

  return (
    <Modal title={plan ? 'Edit plan' : 'Add plan'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field
          label="Plan name"
          data-autofocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={tried ? errors.name : null}
        />
        <Field
          label="Duration in days"
          inputMode="numeric"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          error={tried ? errors.days : null}
          hint="The last day counts: 1 day means today only."
        />
        <Field
          label="Price"
          prefix="₱"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={tried ? errors.price : null}
        />
        {plan && (
          <p className="text-sm text-ink-muted">
            Changes apply to new sales. Existing memberships keep their dates.
          </p>
        )}
        <Button type="submit" disabled={!online}>
          Save plan
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </form>
    </Modal>
  )
}
