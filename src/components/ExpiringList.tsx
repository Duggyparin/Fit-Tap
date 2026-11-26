import { RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { EXPIRING_DAYS } from '../lib/constants'
import { useMembers } from '../lib/data'
import { formatDate } from '../lib/format'
import { sortMembers } from '../lib/members'
import ButtonLink from './ButtonLink'
import DaysLeftBadge from './DaysLeftBadge'
import MemberPhoto from './MemberPhoto'

// Members whose membership ends within EXPIRING_DAYS, soonest first.
export default function ExpiringList() {
  const records = sortMembers(
    useMembers().data.filter((r) => r.status === 'expiring'),
    { by: 'end', ascending: true },
  )

  if (records.length === 0) {
    return (
      <p className="p-4 text-sm text-ink-muted">
        No memberships end in the next {EXPIRING_DAYS} days.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-line">
      {records.map((record) => (
        <li key={record.member.member_id} className="flex items-center gap-3 p-4">
          <MemberPhoto member={record.member} />
          <div className="min-w-0 flex-1">
            <Link
              to={`/members/${record.member.member_id}`}
              className="block font-semibold hover:underline"
            >
              {record.member.full_name}
            </Link>
            <p className="mb-1 text-sm text-ink-muted">
              Ends {formatDate(record.endDate!)}
            </p>
            <DaysLeftBadge record={record} />
          </div>
          <ButtonLink
            variant="secondary"
            icon={RefreshCw}
            to={`/renew?member=${record.member.member_id}`}
          >
            Renew
          </ButtonLink>
        </li>
      ))}
    </ul>
  )
}
