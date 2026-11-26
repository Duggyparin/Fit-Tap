import { Clock, CreditCard, Nfc, Radio, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { endLinkRequest, simulateLinkTap, type ScannerView } from '../../lib/data'
import { LINK_SECONDS } from '../../lib/constants'
import { scannerLook } from '../../lib/status'
import { useNow } from '../../lib/useNow'
import { useOnline } from '../../lib/useOnline'
import type { LinkRequest, Member } from '../../types'
import Button from '../Button'
import Icon from '../Icon'
import MemberPhoto from '../MemberPhoto'
import StatusBadge from '../StatusBadge'
import CountdownRing from './CountdownRing'

const PANEL = 'flex flex-col items-center gap-3 rounded-xl border border-line bg-card p-5 text-center'

// "Tap on scanner": either the screen before starting (scanner picker and
// offline warning) or the live screen for the current request.
export default function ScannerLink({
  member,
  scanners,
  scannerId,
  onScanner,
  request,
  busy,
  onStart,
  onCancel,
  onOtherMethod,
}: {
  member: Member
  scanners: ScannerView[]
  scannerId: string
  onScanner: (id: string) => void
  request: LinkRequest | null
  busy: boolean
  onStart: () => void
  onCancel: () => void
  onOtherMethod: (step: 'recent' | 'number') => void
}) {
  const online = useOnline()
  const selected = scanners.find((s) => s.scanner.scanner_id === scannerId)

  if (!selected) {
    return (
      <div className={PANEL}>
        <p className="font-semibold">This gym has no active scanner.</p>
        <Button onClick={() => onOtherMethod('number')}>Type card number</Button>
      </div>
    )
  }

  if (request) {
    return (
      <Waiting
        key={request.request_id}
        member={member}
        scannerName={selected.scanner.scanner_name}
        request={request}
        onRetry={onStart}
        onCancel={onCancel}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {scanners.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">Scanner</legend>
          {scanners.map(({ scanner, online: up }) => (
            <label
              key={scanner.scanner_id}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line bg-card px-4 has-checked:border-primary"
            >
              <input
                type="radio"
                name="scanner"
                className="size-5 accent-primary"
                checked={scanner.scanner_id === scannerId}
                onChange={() => onScanner(scanner.scanner_id)}
              />
              <span className="flex-1 font-medium">
                {scanner.scanner_name}
                {scanner.is_default && <span className="text-sm text-ink-muted"> · Default</span>}
              </span>
              <StatusBadge {...scannerLook(up)} />
            </label>
          ))}
        </fieldset>
      )}

      {!selected.online && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning bg-card p-4">
          <p className="flex items-start gap-2 text-sm font-medium">
            <Icon icon={TriangleAlert} size={20} className="shrink-0 text-warning" />
            {selected.scanner.scanner_name} scanner looks offline. Use recent taps or the card
            number instead.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onOtherMethod('recent')}>
              Recent taps
            </Button>
            <Button variant="secondary" onClick={() => onOtherMethod('number')}>
              Type card number
            </Button>
          </div>
        </div>
      )}

      {busy && (
        <p role="alert" className="rounded-xl border border-danger bg-card p-4 font-semibold">
          The scanner is busy linking another card. Try again in a moment.
        </p>
      )}

      <Button
        icon={Radio}
        variant={selected.online ? 'primary' : 'secondary'}
        onClick={onStart}
        disabled={!online}
      >
        {selected.online ? 'Start waiting' : 'Start anyway'}
      </Button>
      {!online && <p className="text-sm text-ink-muted">Reconnect to the internet to link.</p>}
    </div>
  )
}

function Waiting({
  member,
  scannerName,
  request,
  onRetry,
  onCancel,
}: {
  member: Member
  scannerName: string
  request: LinkRequest
  onRetry: () => void
  onCancel: () => void
}) {
  const online = useOnline()
  const now = useNow(250)
  const left = Math.min(
    LINK_SECONDS,
    Math.max(0, Math.ceil((Date.parse(request.expires_at) - now) / 1000)),
  )
  const refused = request.result === 'already_linked' || request.result === 'other_gym'
  const timedOut = !refused && (request.status === 'expired' || left === 0)

  useEffect(() => {
    if (left === 0) endLinkRequest(request.request_id, 'expired')
  }, [left, request.request_id])

  if (refused || timedOut) {
    const title = timedOut
      ? 'Time ran out.'
      : request.result === 'other_gym'
        ? 'This card belongs to another gym.'
        : 'This card already belongs to another member.'
    return (
      <div role="alert" className={PANEL}>
        <Icon icon={timedOut ? Clock : CreditCard} size={48} className="text-danger" />
        <h2 className="text-lg font-bold">{title}</h2>
        {timedOut && <p className="text-sm text-ink-muted">No card was tapped in time.</p>}
        <Button onClick={onRetry} disabled={!online} className="w-full">
          {timedOut ? 'Try again' : 'Try another card'}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className={PANEL}>
      <span className="relative flex size-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping" />
        <span className="relative flex size-24 items-center justify-center rounded-full bg-navy text-card">
          <Icon icon={Nfc} size={48} />
        </span>
      </span>
      <h2 className="mt-2 text-xl font-bold">Tap the card on {scannerName} now</h2>
      <CountdownRing secondsLeft={left} total={LINK_SECONDS} />
      <div className="flex items-center gap-3">
        <MemberPhoto member={member} />
        <span className="font-semibold">{member.full_name}</span>
      </div>
      <Button variant="secondary" onClick={onCancel} className="w-full">
        Cancel
      </Button>

      {import.meta.env.DEV && (
        <div className="mt-2 flex w-full flex-col gap-2 border-t border-line pt-3">
          <p className="text-xs text-ink-muted">Testing only: Simulate tap</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => simulateLinkTap(request.request_id, 'linked')}>
              Linked
            </Button>
            <Button
              variant="secondary"
              onClick={() => simulateLinkTap(request.request_id, 'already_linked')}
            >
              Already linked
            </Button>
            <Button
              variant="secondary"
              onClick={() => simulateLinkTap(request.request_id, 'other_gym')}
            >
              Other gym
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
