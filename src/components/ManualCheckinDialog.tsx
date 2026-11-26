import { ArrowLeft, CircleCheck, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { addManualCheckin, useMember, useTodayCheckins } from '../lib/data'
import { formatDate, formatTime } from '../lib/format'
import { canEnter, type MemberRecord } from '../lib/members'
import { useOnline } from '../lib/useOnline'
import type { Checkin } from '../types'
import Button from './Button'
import ButtonLink from './ButtonLink'
import DaysLeftBadge from './DaysLeftBadge'
import Icon from './Icon'
import MemberPhoto from './MemberPhoto'
import MemberPicker from './MemberPicker'
import Modal from './Modal'
import { MembershipBadge } from './StatusBadge'

// Staff check a member in by hand: search -> confirm the face -> done.
// Pass memberId to skip the search (used on the member profile).
export default function ManualCheckinDialog({
  memberId,
  onClose,
}: {
  memberId?: string
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string | null>(memberId ?? null)
  const [done, setDone] = useState<Checkin | null>(null)
  const member = useMember(selected ?? undefined).data

  function startOver() {
    setSelected(null)
    setDone(null)
  }

  return (
    <Modal title="Manual check-in" onClose={onClose}>
      {done && member ? (
        <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
          <Icon icon={CircleCheck} size={56} className="text-success" />
          <h3 className="text-xl font-bold">{member.member.full_name} checked in</h3>
          <p className="text-sm text-ink-muted">{formatTime(done.scanned_at)} · Manual</p>
          <div className="mt-3 flex w-full flex-col gap-2">
            <Button onClick={onClose}>Done</Button>
            <Button variant="secondary" onClick={startOver}>
              Check in another
            </Button>
          </div>
        </div>
      ) : member ? (
        <Confirm
          record={member}
          onBack={memberId ? undefined : () => setSelected(null)}
          onClose={onClose}
          onCheckIn={() => setDone(addManualCheckin(member.member.member_id))}
        />
      ) : (
        <MemberPicker autoFocus onSelect={setSelected} />
      )}
    </Modal>
  )
}

// Why a member may not enter.
function refusalReason(record: MemberRecord): string {
  if (record.status === 'frozen') return 'Membership frozen'
  if (record.status === 'cancelled') return 'Membership cancelled'
  if (!record.endDate) return 'No membership yet'
  return `Membership expired on ${formatDate(record.endDate)}`
}

function Confirm({
  record,
  onBack,
  onClose,
  onCheckIn,
}: {
  record: MemberRecord
  onBack?: () => void
  onClose: () => void
  onCheckIn: () => void
}) {
  const online = useOnline()
  const { member, plan, status } = record
  // The newest allowed check-in today, if any (the list is newest first).
  const earlier = useTodayCheckins().data.find(
    (v) => v.checkin.member_id === member.member_id && v.checkin.result === 'allowed',
  )
  const allowed = canEnter(status)

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {onBack && (
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack} className="self-start">
          Choose another member
        </Button>
      )}
      <MemberPhoto member={member} size="lg" />
      <h3 className="text-2xl font-bold">{member.full_name}</h3>
      <p className="text-sm text-ink-muted">{plan?.plan_name ?? 'No plan'}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <MembershipBadge state={status} />
        {allowed && <DaysLeftBadge record={record} />}
      </div>

      <div className="mt-3 flex w-full flex-col gap-2">
        {allowed ? (
          <>
            {earlier && (
              <p className="text-sm font-medium">
                Already checked in today at {formatTime(earlier.checkin.scanned_at)}
              </p>
            )}
            <Button onClick={onCheckIn} disabled={!online}>
              Check in
            </Button>
            {!online && (
              <p className="text-sm text-ink-muted">Reconnect to the internet to check in.</p>
            )}
          </>
        ) : (
          <>
            <p className="rounded-lg border border-danger bg-card p-3 font-semibold">
              {refusalReason(record)}
            </p>
            <ButtonLink to={`/renew?member=${member.member_id}`} onClick={onClose} icon={RefreshCw}>
              Renew
            </ButtonLink>
          </>
        )}
      </div>
    </div>
  )
}
