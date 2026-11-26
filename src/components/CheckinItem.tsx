import { DENIAL_REASON } from '../lib/checkins'
import type { CheckinView } from '../lib/data'
import { formatTime } from '../lib/format'
import MemberPhoto from './MemberPhoto'
import { CheckinBadge } from './StatusBadge'

// One tap in the feed. `featured` is the big version for the newest tap, so
// staff can compare the photo with the person at the door.
export default function CheckinItem({
  view,
  featured = false,
}: {
  view: CheckinView
  featured?: boolean
}) {
  const { checkin, member, scannerName } = view
  const name = member?.full_name ?? 'Unknown card'
  const time = formatTime(checkin.scanned_at)
  // Without a member, the scanner name tells staff where the card was tapped.
  const detail = !member && scannerName ? `${time} · ${scannerName}` : time
  const reason = DENIAL_REASON[checkin.result]

  if (featured) {
    return (
      <article className="flex flex-col items-center gap-2 rounded-xl border border-line bg-card p-6 text-center">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Latest tap</p>
        <MemberPhoto member={member} size="lg" />
        <h2 className="text-2xl font-bold">{name}</h2>
        <p className="text-sm text-ink-muted">{detail}</p>
        <CheckinBadge result={checkin.result} source={checkin.source} />
        {reason && <p className="text-sm font-medium">{reason}</p>}
      </article>
    )
  }

  return (
    <article className="flex items-start gap-3 p-4">
      <MemberPhoto member={member} />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-ink-muted">{detail}</p>
        <div className="mt-1.5">
          <CheckinBadge result={checkin.result} source={checkin.source} />
        </div>
        {reason && <p className="mt-1 text-sm">{reason}</p>}
      </div>
    </article>
  )
}
