import { QrCode } from 'lucide-react'
import { useSettings } from '../lib/data'
import { formatPeso } from '../lib/format'
import { METHOD_LABEL } from '../lib/payments'
import type { QrMethod } from '../lib/store'
import Icon from './Icon'

// The gym owner's own QR code, shown large with the amount. The money goes
// straight to the owner's account; FitTap never handles it.
export default function QrPayment({
  method,
  amountCentavos,
}: {
  method: QrMethod
  amountCentavos: number | null
}) {
  const image = useSettings().data.qrCodes[method]
  const name = METHOD_LABEL[method]

  if (!image) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-line bg-card p-4 text-sm">
        <Icon icon={QrCode} className="shrink-0 text-ink-muted" />
        No {name} QR code yet. The owner can add it in Settings.
      </p>
    )
  }

  return (
    <figure className="flex flex-col items-center gap-2 rounded-xl border border-line bg-card p-4 text-center">
      <img
        src={image}
        alt={`The gym’s ${name} QR code`}
        className="w-full max-w-80 rounded-lg"
      />
      <figcaption>
        <p className="text-lg font-bold">
          Scan to pay{amountCentavos !== null && ` ${formatPeso(amountCentavos)}`} with {name}
        </p>
        <p className="text-sm text-ink-muted">
          Confirm the payment arrived on the owner’s phone, then type the reference number.
        </p>
      </figcaption>
    </figure>
  )
}
