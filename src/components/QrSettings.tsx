import { QrCode, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { setQrCode, useSettings } from '../lib/data'
import { METHOD_LABEL } from '../lib/payments'
import { qrFromFile } from '../lib/photo'
import type { QrMethod } from '../lib/store'
import Button from './Button'
import ConfirmDialog from './ConfirmDialog'
import Icon from './Icon'
import Panel from './Panel'

// Upload, replace or remove the payment QR pictures. Each change is confirmed,
// because a wrong QR code sends members' money to someone else.
export default function QrSettings({ disabled }: { disabled: boolean }) {
  const qrCodes = useSettings().data.qrCodes
  // A change waiting for confirmation; image null = remove.
  const [pending, setPending] = useState<{ method: QrMethod; image: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function pick(method: QrMethod, file: File | undefined) {
    if (!file) return
    try {
      setPending({ method, image: await qrFromFile(file) })
      setError(null)
    } catch {
      setError('That file is not a picture that can be read.')
    }
  }

  return (
    <Panel title="Payment QR codes">
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm text-ink-muted">
          Shown to members who pay with GCash or Maya. Every change is recorded in the activity log.
        </p>
        {error && <p role="alert" className="text-sm font-medium">{error}</p>}
        {(['gcash', 'maya'] as const).map((method) => {
          const image = qrCodes[method]
          const name = METHOD_LABEL[method]
          return (
            <div key={method} className="flex items-center gap-3">
              <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-page">
                {image ? (
                  <img src={image} alt={`${name} QR code`} className="size-full object-contain" />
                ) : (
                  <Icon icon={QrCode} size={32} className="text-ink-muted" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-semibold">
                  {name}
                  <span className="font-normal text-ink-muted">
                    {image ? ' · added' : ' · not added'}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-primary ${
                      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <Icon icon={Upload} size={18} />
                    {image ? 'Replace' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      aria-label={`${image ? 'Replace' : 'Upload'} ${name} QR code`}
                      className="sr-only"
                      disabled={disabled}
                      onChange={(e) => {
                        void pick(method, e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {image && (
                    <Button
                      variant="secondary"
                      icon={Trash2}
                      disabled={disabled}
                      onClick={() => setPending({ method, image: null })}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {pending && (
        <ConfirmDialog
          title={pending.image ? 'Use this QR code?' : 'Remove QR code?'}
          message={
            pending.image
              ? `Members paying with ${METHOD_LABEL[pending.method]} will send money to this code. Check that it is your own account.`
              : `The ${METHOD_LABEL[pending.method]} QR code will no longer be shown at payment.`
          }
          preview={pending.image}
          confirmText={pending.image ? 'Yes, use this code' : 'Remove code'}
          onClose={() => setPending(null)}
          onConfirm={() => {
            setQrCode(pending.method, pending.image)
            setPending(null)
          }}
        />
      )}
    </Panel>
  )
}
