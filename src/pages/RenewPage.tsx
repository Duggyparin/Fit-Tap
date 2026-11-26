import { Snowflake } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import Button from '../components/Button'
import ButtonLink from '../components/ButtonLink'
import DaysLeftBadge from '../components/DaysLeftBadge'
import Field from '../components/Field'
import Icon from '../components/Icon'
import MemberPhoto from '../components/MemberPhoto'
import MemberPicker from '../components/MemberPicker'
import PaymentFields from '../components/PaymentFields'
import PlanPicker from '../components/PlanPicker'
import SuccessPanel from '../components/SuccessPanel'
import { renewMembership, useMember, usePlans, type MemberDetail } from '../lib/data'
import { formatDate, formatPeso, formatRange, todayInManila } from '../lib/format'
import { endDateFor, latestRunning, renewalStartFor } from '../lib/membership'
import { NEW_PAYMENT, parsePesos, referenceError } from '../lib/payments'
import { useOnline } from '../lib/useOnline'
import type { Membership } from '../types'

export default function RenewPage() {
  // The chosen member lives in the address: /renew?member=:id
  const [params, setParams] = useSearchParams()
  const record = useMember(params.get('member') ?? undefined).data

  const choose = (id: string | null) =>
    setParams(id ? { member: id } : {}, { replace: true })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-navy">Renew</h1>
      {record ? (
        // key: a new member (or "Renew another") starts with a clean form.
        <RenewForm key={record.member.member_id} record={record} onChange={() => choose(null)} />
      ) : (
        <div className="flex w-full max-w-xl flex-col gap-3">
          {params.get('member') && (
            <p role="alert" className="rounded-xl border border-warning bg-card p-4 text-sm">
              That member was not found. Search for them below.
            </p>
          )}
          <MemberPicker onSelect={choose} />
        </div>
      )}
    </div>
  )
}

function RenewForm({ record, onChange }: { record: MemberDetail; onChange: () => void }) {
  const { member, status, endDate } = record
  const online = useOnline()
  const plans = usePlans().data

  // Start with the plan they had, if it is still offered.
  const [planId, setPlanId] = useState(() => {
    const active = plans.filter((p) => p.is_active)
    return (
      active.find((p) => p.plan_id === record.plan?.plan_id) ??
      active.find((p) => p.duration_days === 30) ??
      active[0]
    )?.plan_id
  })
  const plan = plans.find((p) => p.plan_id === planId)
  // null = use the plan price; a string = staff typed another amount.
  const [typed, setTyped] = useState<string | null>(null)
  const [payment, setPayment] = useState(NEW_PAYMENT)
  const [tried, setTried] = useState(false)
  const [saved, setSaved] = useState<Membership | null>(null)

  if (saved) {
    return (
      <div className="w-full max-w-xl rounded-xl border border-line bg-card px-5">
        <SuccessPanel
          title={`${member.full_name} renewed`}
          detail={formatRange(saved.start_date, saved.end_date)}
        >
          <ButtonLink to={`/members/${member.member_id}`}>Done</ButtonLink>
          <Button variant="secondary" onClick={onChange}>
            Renew another
          </Button>
        </SuccessPanel>
      </div>
    )
  }

  if (!plan) {
    return <p className="text-sm">There are no active plans. Add one on the Plans page.</p>
  }

  const today = todayInManila()
  const start = renewalStartFor(latestRunning(record.memberships, today), today)
  const end = endDateFor(start, plan.duration_days)
  const amountText = typed ?? String(plan.price_centavos / 100)
  const amount = parsePesos(amountText)
  const errors = {
    amount: amount === null ? 'Enter an amount above zero.' : null,
    reference: referenceError(payment),
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (errors.amount || errors.reference) return setTried(true)
    setSaved(renewMembership(member.member_id, plan!.plan_id, payment, amount!))
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="flex flex-col gap-4">
        <section className="flex items-center gap-3 rounded-xl border border-line bg-card p-4">
          <MemberPhoto member={member} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{member.full_name}</p>
            <p className="mb-1 text-sm text-ink-muted">
              {endDate ? `Current end date: ${formatDate(endDate)}` : 'No membership yet'}
            </p>
            <DaysLeftBadge record={record} />
          </div>
          <Button variant="secondary" onClick={onChange}>
            Change
          </Button>
        </section>
        {status === 'frozen' && (
          <p className="flex items-start gap-2 rounded-xl border border-line bg-card p-4 text-sm">
            <Icon icon={Snowflake} size={20} className="shrink-0 text-muted" />
            This membership is frozen. The new period starts after the frozen one ends, and the
            member still cannot enter until it is unfrozen.
          </p>
        )}
        <PlanPicker
          plans={plans}
          value={plan.plan_id}
          onChange={(id) => {
            setPlanId(id)
            setTyped(null) // back to the new plan's price
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-sm text-ink-muted">New membership</p>
          <p className="text-lg font-bold text-navy">{formatRange(start, end)}</p>
          {start > today && (
            <p className="mt-1 text-sm text-ink-muted">
              Starts the day after the current one ends, so no days are lost.
            </p>
          )}
        </div>
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
        />
        <Button type="submit" disabled={!online}>
          Confirm renewal{amount !== null && ` · ${formatPeso(amount)}`}
        </Button>
        {!online && <p className="text-sm text-ink-muted">Reconnect to the internet to save.</p>}
      </div>
    </form>
  )
}
