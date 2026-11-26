import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import PlanDialog from '../components/PlanDialog'
import Switch from '../components/Switch'
import { setPlanActive, useCurrentUser, usePlans } from '../lib/data'
import { formatPeso } from '../lib/format'
import { useOnline } from '../lib/useOnline'
import type { Plan } from '../types'

export default function PlansPage() {
  const plans = usePlans().data
  const isOwner = useCurrentUser().data.role === 'owner'
  const online = useOnline()
  // undefined = closed, null = adding a new plan
  const [editing, setEditing] = useState<Plan | null | undefined>(undefined)
  const activeCount = plans.filter((p) => p.is_active).length

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Plans"
        subtitle={isOwner ? 'Membership lengths and prices' : 'Only the owner can change plans'}
        action={
          isOwner && (
            <Button icon={Plus} onClick={() => setEditing(null)}>
              Add plan
            </Button>
          )
        }
      />
      <ul className="divide-y divide-line rounded-xl border border-line bg-card">
        {plans.map((plan) => (
          <li key={plan.plan_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
            <div className="min-w-0 flex-1 basis-40">
              <p className="font-semibold">{plan.plan_name}</p>
              <p className="text-sm text-ink-muted">
                {plan.duration_days} {plan.duration_days === 1 ? 'day' : 'days'}
              </p>
            </div>
            <p className="text-lg font-bold text-navy">{formatPeso(plan.price_centavos)}</p>
            <div className="flex w-full items-center justify-between gap-3 lg:w-auto">
              <Switch
                label={`${plan.plan_name} plan is active`}
                onText="Active"
                offText="Retired"
                checked={plan.is_active}
                // At least one plan must stay on sale.
                disabled={!isOwner || !online || (plan.is_active && activeCount === 1)}
                onChange={(active) => setPlanActive(plan.plan_id, active)}
              />
              {isOwner && (
                <Button variant="secondary" icon={Pencil} onClick={() => setEditing(plan)}>
                  Edit
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {editing !== undefined && (
        <PlanDialog plan={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
