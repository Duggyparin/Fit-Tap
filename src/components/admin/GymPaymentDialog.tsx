import { useState, type FormEvent } from 'react'
import { recordGymPayment } from '../../lib/adminData'
import { formatDate, todayInManila } from '../../lib/format'
import { NEW_PAYMENT, parsePesos, referenceError } from '../../lib/payments'
import { addMonth } from '../../lib/platform'
import { useOnline } from '../../lib/useOnline'
import type { Gym } from '../../types'
import Button from '../Button'
import Field from '../Field'
import Modal from '../Modal'
import PaymentFields from '../PaymentFields'

export default function GymPaymentDialog({ gym, onClose }: { gym: Gym; onClose: () => void }) {
  const online = useOnline()
  const [amount, setAmount] = useState(String(gym.monthly_fee_centavos / 100))
  const [payment, setPayment] = useState(NEW_PAYMENT)
  const [tried, setTried] = useState(false)
  const centavos = parsePesos(amount)
  const next = addMonth(gym.next_due_date ?? todayInManila())

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (centavos === null || referenceError(payment)) return setTried(true)
    recordGymPayment(gym.gym_id, centavos, payment)
    onClose()
  }

  return (
    <Modal title="Record payment" onClose={onClose}>
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
        <p className="text-sm text-ink-muted">Next due date will be {formatDate(next)}.</p>
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
