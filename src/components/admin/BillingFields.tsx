import type { Billing } from '../../lib/billing'
import type { BillingCycle } from '../../types'
import Field from '../Field'
import SelectField from '../SelectField'

export default function BillingFields({
  value,
  onChange,
  error,
}: {
  value: Billing
  onChange: (value: Billing) => void
  error: string | null
}) {
  return (
    <>
      <SelectField
        label="Billing cycle"
        value={value.cycle}
        onChange={(e) => onChange({ ...value, cycle: e.target.value as BillingCycle })}
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'annual', label: 'Annual prepay' },
        ]}
      />
      {value.cycle === 'annual' && (
        <Field
          label="Annual discount (%)"
          inputMode="numeric"
          value={value.discount}
          onChange={(e) => onChange({ ...value, discount: e.target.value })}
          error={error}
        />
      )}
    </>
  )
}
