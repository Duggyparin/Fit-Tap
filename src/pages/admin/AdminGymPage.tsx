import { ArrowLeft, Ban, Circle, CircleCheck, CreditCard, Eye, RotateCcw, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import GymPaymentDialog from '../../components/admin/GymPaymentDialog'
import Button from '../../components/Button'
import ButtonLink from '../../components/ButtonLink'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import Panel from '../../components/Panel'
import StatusBadge from '../../components/StatusBadge'
import { reactivateGym, startViewAs, suspendGym, useAdminGym } from '../../lib/adminData'
import { formatDate, formatPeso } from '../../lib/format'
import { METHOD_LABEL } from '../../lib/payments'
import { GRACE_DAYS } from '../../lib/platform'
import { GYM_STATUS, SUBSCRIPTION_STATUS } from '../../lib/status'
import { useOnline } from '../../lib/useOnline'

export default function AdminGymPage() {
  const { id } = useParams()
  const detail = useAdminGym(id).data
  const online = useOnline()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<'pay' | 'suspend' | 'reactivate' | null>(null)

  if (!detail) {
    return (
      <EmptyState
        icon={Store}
        title="Gym not found"
        text="There is no gym with this address."
        action={<ButtonLink to="/admin/gyms">Back to gyms</ButtonLink>}
      />
    )
  }

  const { gym, owner, steps, subscription, payments } = detail
  const finished = steps.filter((s) => s.done).length
  const close = () => setDialog(null)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Link
        to="/admin/gyms"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary"
      >
        <Icon icon={ArrowLeft} size={18} />
        Gyms
      </Link>
      <PageHeader
        title={gym.gym_name}
        subtitle={`${gym.city} · ${owner ? `${owner.display_name} (${owner.email})` : 'No owner yet'}`}
        action={<StatusBadge {...GYM_STATUS[gym.status]} />}
      />

      <Button
        variant="secondary"
        icon={Eye}
        className="self-start"
        onClick={() => {
          startViewAs(gym.gym_id)
          navigate('/')
        }}
      >
        View as gym (read-only)
      </Button>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <Panel title={`Onboarding checklist (${finished} of ${steps.length})`}>
          <ul className="divide-y divide-line">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-3 px-4 py-3">
                <Icon
                  icon={step.done ? CircleCheck : Circle}
                  className={step.done ? 'text-success' : 'text-ink-muted'}
                />
                <span className="flex-1">{step.label}</span>
                <span className="text-sm text-ink-muted">{step.done ? 'Done' : 'Not yet'}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Subscription" action={<StatusBadge {...SUBSCRIPTION_STATUS[subscription]} />}>
          <dl className="grid grid-cols-2 gap-3 p-4">
            <div>
              <dt className="text-sm text-ink-muted">Monthly fee</dt>
              <dd className="text-lg font-bold">{formatPeso(gym.monthly_fee_centavos)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Next due date</dt>
              <dd className="text-lg font-bold">
                {gym.next_due_date ? formatDate(gym.next_due_date) : 'Not set'}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 px-4 pb-4">
            <Button icon={CreditCard} onClick={() => setDialog('pay')} disabled={!online}>
              Record payment
            </Button>
            {gym.status === 'suspended' ? (
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={() => setDialog('reactivate')}
                disabled={!online}
              >
                Reactivate
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  icon={Ban}
                  onClick={() => setDialog('suspend')}
                  disabled={!online || subscription !== 'overdue'}
                >
                  Suspend
                </Button>
                {subscription !== 'overdue' && (
                  <p className="text-sm text-ink-muted">
                    Suspending is offered when a payment is more than {GRACE_DAYS} days overdue.
                  </p>
                )}
              </>
            )}
          </div>
          <h3 className="border-t border-line px-4 pt-3 text-sm font-semibold">Payment history</h3>
          {payments.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {payments.map((p) => (
                <li key={p.gym_payment_id} className="flex justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{formatDate(p.paid_at)}</p>
                    <p className="text-sm break-all text-ink-muted">
                      {METHOD_LABEL[p.method]}
                      {p.reference_no && ` · ${p.reference_no}`}
                    </p>
                  </div>
                  <span className="font-semibold">{formatPeso(p.amount_centavos)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {dialog === 'pay' && <GymPaymentDialog gym={gym} onClose={close} />}
      {dialog === 'suspend' && (
        <ConfirmDialog
          title="Suspend gym?"
          message={`${gym.gym_name} will be marked as suspended.`}
          confirmText="Suspend gym"
          onConfirm={() => {
            suspendGym(gym.gym_id)
            close()
          }}
          onClose={close}
        />
      )}
      {dialog === 'reactivate' && (
        <ConfirmDialog
          title="Reactivate gym?"
          message={`${gym.gym_name} will get access again.`}
          confirmText="Reactivate gym"
          onConfirm={() => {
            reactivateGym(gym.gym_id)
            close()
          }}
          onClose={close}
        />
      )}
    </div>
  )
}
