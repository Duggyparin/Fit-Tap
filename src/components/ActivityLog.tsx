import { useGymActivity } from '../lib/data'
import { formatDate, formatTime } from '../lib/format'
import type { GymAuditAction } from '../types'
import Panel from './Panel'

const ACTION: Record<GymAuditAction, string> = {
  qr_added: 'QR code added',
  qr_changed: 'QR code changed',
  qr_removed: 'QR code removed',
  member_anonymized: 'Member anonymized',
}

// What the owner, staff or the system changed in this gym, newest first.
export default function ActivityLog() {
  const entries = useGymActivity().data

  return (
    <Panel title="Activity log">
      {entries.length === 0 ? (
        <p className="p-4 text-sm text-ink-muted">Nothing recorded yet.</p>
      ) : (
        <ol className="divide-y divide-line">
          {entries.map((e) => (
            <li key={e.gym_audit_id} className="px-4 py-3">
              <p className="font-semibold">{ACTION[e.action]}</p>
              <p className="text-sm">{e.detail}</p>
              <p className="text-sm text-ink-muted">
                {e.actor} · {formatDate(e.created_at)}, {formatTime(e.created_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
