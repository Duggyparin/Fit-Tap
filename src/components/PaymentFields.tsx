import { METHOD_LABEL, needsReference, PAYMENT_CHOICES, type PaymentInput } from '../lib/payments'
import Field from './Field'

// Cash / GCash / Maya, plus the reference number for e-wallets.
export default function PaymentFields({
  value,
  onChange,
  error,
}: {
  value: PaymentInput
  onChange: (value: PaymentInput) => void
  error?: string | null // problem with the reference number
}) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Payment method</legend>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_CHOICES.map((method) => (
            <label
              key={method}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-primary ${
                value.method === method
                  ? 'border-primary bg-primary text-card'
                  : 'border-line bg-card'
              }`}
            >
              <input
                type="radio"
                name="method"
                className="sr-only"
                checked={value.method === method}
                onChange={() => onChange({ ...value, method })}
              />
              {METHOD_LABEL[method]}
            </label>
          ))}
        </div>
      </fieldset>
      {needsReference(value.method) && (
        <Field
          label="Reference number"
          value={value.referenceNo}
          onChange={(e) => onChange({ ...value, referenceNo: e.target.value })}
          error={error}
          autoComplete="off"
        />
      )}
    </div>
  )
}
