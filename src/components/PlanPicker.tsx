import { CircleCheck } from 'lucide-react'
import { formatPeso } from '../lib/format'
import type { Plan } from '../types'
import Icon from './Icon'

// Plan cards; exactly one is selected. Retired plans are not offered.
export default function PlanPicker({
  plans,
  value,
  onChange,
}: {
  plans: Plan[]
  value: string
  onChange: (planId: string) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">Plan</legend>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {plans
          .filter((p) => p.is_active)
          .map((plan) => {
            const selected = plan.plan_id === value
            return (
              <label
                key={plan.plan_id}
                className={`relative flex cursor-pointer flex-col rounded-xl border bg-card p-3 has-focus-visible:outline-2 has-focus-visible:outline-primary ${
                  selected ? 'border-primary ring-1 ring-primary' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  className="sr-only"
                  checked={selected}
                  onChange={() => onChange(plan.plan_id)}
                />
                <span className="pr-6 text-sm font-semibold">{plan.plan_name}</span>
                <span className="text-xs text-ink-muted">
                  {plan.duration_days} {plan.duration_days === 1 ? 'day' : 'days'}
                </span>
                <span className="mt-1 text-lg font-bold text-navy">
                  {formatPeso(plan.price_centavos)}
                </span>
                {selected && (
                  <Icon icon={CircleCheck} size={18} className="absolute top-2 right-2 text-primary" />
                )}
              </label>
            )
          })}
      </div>
    </fieldset>
  )
}
