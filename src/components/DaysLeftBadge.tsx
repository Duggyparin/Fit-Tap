import type { MemberRecord } from '../lib/members'
import { daysLeftLook } from '../lib/status'
import StatusBadge from './StatusBadge'

export default function DaysLeftBadge({ record }: { record: MemberRecord }) {
  return <StatusBadge {...daysLeftLook(record.status, record.daysLeft)} />
}
