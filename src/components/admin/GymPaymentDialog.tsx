import { useState, type FormEvent } from 'react'
import { recordGymPayment } from '../../lib/adminData'
import { formatDate, todayInManila } from '../../lib/format'
import { NEW_PAYMENT, parsePesos, referenceError } from '../../lib/payments'
import { addMonth, cycleMonths, cyclePrice } from '../../lib/platform'
import { useOnline } from '../../lib/useOnline'
import type { Gym, GymPaymentKind } from '../../types'
import Button from '../Button'
import Field from '../Field'
import Modal from '../Modal'
import PaymentFields from '../PaymentFields'

export default function GymPaymentDialog({
  gym,
  kind,
  onClose,
}: {
  gym: Gym
  kind: GymPaymentKind
  onClose: () => void
}) {
  const online = useOnline()
  const due = kind === 'setup' ? gym.setup_fee_centavos : cyclePrice(gym)
  const [amount, setAmount] = useState(String(due / 100))
  const [payment, setPayment] = useState(NEW_PAYMENT)
  const [tried, setTried] = useState(false)
  const centavos = parsePesos(amount)
  const next = addMonth(gym.next_due_date ?? todayInManila(), cycleMonths(gym))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (centavos === null || referenceError(payment)) return setTried(true)
    recordGymPayment(gym.gym_id, centavos, payment, kind)
    onClose()
  }

  return (
    <Modal title={kind === 'setup' ? 'Record setup fee' : 'Record payment'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <p className="font-semibold">{gym.gym_name}</p>
        <Field
          label="Amount"
          prefix="₱"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={tried && centavos === null ? 'Enter an amount above zero.' : null}
        />
        <PaymentFields
          value={payment}
          onChange={setPayment}
          error={tried ? referenceError(payment) : null}
        />
        <p className="text-sm text-ink-muted">
          {kind === 'setup'
            ? 'The one-time setup fee does not change the due date.'
            : `Next due date will be ${formatDate(next)}.`}
        </p>
        <Button type="submit" disabled={!online}>
          Save payment
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </form>
    </Modal>
  )
}
