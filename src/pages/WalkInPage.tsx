import { CircleCheck, Clock, DoorOpen } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Field from '../components/Field'
import Icon from '../components/Icon'
import PaymentFields from '../components/PaymentFields'
import { addWalkIn, useSettings, useTodayWalkIns } from '../lib/data'
import { formatPeso, formatTime } from '../lib/format'
import { METHOD_LABEL, NEW_PAYMENT, parsePesos, referenceError } from '../lib/payments'
import { useNow } from '../lib/useNow'
import { useOnline } from '../lib/useOnline'
import type { WalkIn } from '../types'

export default function WalkInPage() {
  const online = useOnline()
  const now = useNow(5_000)
  const settings = useSettings().data
  const today = useTodayWalkIns().data

  const [name, setName] = useState('')
  // null = use the gym's default price.
  const [typed, setTyped] = useState<string | null>(null)
  const [payment, setPayment] = useState(NEW_PAYMENT)
  const [tried, setTried] = useState(false)
  const [last, setLast] = useState<WalkIn | null>(null)

  const amountText = typed ?? String(settings.walkInCentavos / 100)
  const amount = parsePesos(amountText)
  const errors = {
    amount: amount === null ? 'Enter an amount above zero.' : null,
    reference: referenceError(payment),
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (errors.amount || errors.reference) return setTried(true)
    setLast(addWalkIn({ guestName: name, amountCentavos: amount!, payment }))
    // Ready for the next guest.
    setName('')
    setTyped(null)
    setPayment(NEW_PAYMENT)
    setTried(false)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-navy">Walk-in</h1>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field
            label="Guest name"
            optional
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <Field
            label="Amount"
            prefix="₱"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setTyped(e.target.value)}
            error={tried ? errors.amount : null}
          />
          <PaymentFields
            value={payment}
            onChange={setPayment}
            error={tried ? errors.reference : null}
            qrAmount={amount}
          />
          <p className="flex items-center gap-3 rounded-xl border border-line bg-card p-4 text-sm">
            <Icon icon={Clock} className="text-ink-muted" />
            <span className="text-ink-muted">Time, recorded automatically</span>
            <strong className="ml-auto">{formatTime(new Date(now).toISOString())}</strong>
          </p>
          <Button type="submit" disabled={!online}>
            Record walk-in{amount !== null && ` · ${formatPeso(amount)}`}
          </Button>
          {!online && <p className="text-sm text-ink-muted">Reconnect to the internet to save.</p>}
          <div role="status">
            {last && (
              <p className="flex items-center gap-2 rounded-xl border border-success bg-card p-4 text-sm font-semibold">
                <Icon icon={CircleCheck} className="text-success" />
                Walk-in recorded: {formatPeso(last.amount_centavos)} at{' '}
                {formatTime(last.visited_at)}
              </p>
            )}
          </div>
        </form>

        <section aria-label="Today’s walk-ins" className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="text-sm text-ink-muted">Walk-ins today</p>
              <p className="text-2xl font-bold text-navy">{today.walkIns.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-card p-4">
              <p className="text-sm text-ink-muted">Today’s total</p>
              <p className="text-2xl font-bold text-navy">{formatPeso(today.totalCentavos)}</p>
            </div>
          </div>
          {today.walkIns.length === 0 ? (
            <EmptyState icon={DoorOpen} title="No walk-ins yet today" text="Record the first one." />
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-card">
              {today.walkIns.map((w) => (
                <li key={w.walkin_id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{w.guest_name ?? 'Walk-in guest'}</p>
                    <p className="text-sm text-ink-muted">
                      {formatTime(w.visited_at)} · {METHOD_LABEL[w.method]}
                    </p>
                  </div>
                  <span className="font-semibold">{formatPeso(w.amount_centavos)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
