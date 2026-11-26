import { CreditCard, Nfc } from 'lucide-react'
import { useState } from 'react'
import { linkCardByUid, useRecentUnknownTaps } from '../../lib/data'
import { RECENT_TAPS_HOURS } from '../../lib/constants'
import { formatAgo, formatTime } from '../../lib/format'
import { useOnline } from '../../lib/useOnline'
import Button from '../Button'
import EmptyState from '../EmptyState'
import Icon from '../Icon'

export default function RecentTapsLink({
  memberId,
  onLinked,
}: {
  memberId: string
  onLinked: () => void
}) {
  const online = useOnline()
  const taps = useRecentUnknownTaps().data
  const [error, setError] = useState<string | null>(null)

  function assign(uid: string) {
    const problem = linkCardByUid(memberId, uid)
    setError(problem)
    if (!problem) onLinked()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Unknown cards tapped in the last {RECENT_TAPS_HOURS} hours. Match the time of the member’s
        tap.
      </p>
      {error && (
        <p role="alert" className="rounded-xl border border-danger bg-card p-4 font-semibold">
          {error}
        </p>
      )}
      {taps.length === 0 ? (
        <EmptyState
          icon={Nfc}
          title="No recent unknown taps"
          text="Tap the card on a scanner, then come back here."
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {taps.map((tap) => (
            <li key={tap.uid} className="flex items-center gap-3 p-4">
              <Icon icon={CreditCard} className="shrink-0 text-ink-muted" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Unknown card at {formatTime(tap.tappedAt)}</p>
                <p className="text-sm text-ink-muted">
                  {tap.scannerName} · {formatAgo(tap.tappedAt)} · ends {tap.uid.slice(-4)}
                </p>
              </div>
              <Button onClick={() => assign(tap.uid)} disabled={!online}>
                Assign
              </Button>
            </li>
          ))}
        </ul>
      )}
      {!online && <p className="text-sm text-ink-muted">Reconnect to the internet to link.</p>}
    </div>
  )
}
