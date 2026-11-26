import { CreditCard } from 'lucide-react'
import { Link } from 'react-router'
import type { MemberRecord } from '../lib/members'
import { NO_CARD_STATUS } from '../lib/status'
import ButtonLink from './ButtonLink'
import DaysLeftBadge from './DaysLeftBadge'
import MemberPhoto from './MemberPhoto'
import StatusBadge from './StatusBadge'

// The phone view of the member list.
export default function MemberCardList({ records }: { records: MemberRecord[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {records.map((record) => {
        const { member, plan, card } = record
        return (
          <li key={member.member_id} className="rounded-xl border border-line bg-card">
            <Link to={`/members/${member.member_id}`} className="flex items-start gap-3 p-4">
              <MemberPhoto member={member} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{member.full_name}</span>
                <span className="block text-sm text-ink-muted">
                  {plan?.plan_name ?? 'No plan'}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-2">
                  <DaysLeftBadge record={record} />
                  {!card && <StatusBadge {...NO_CARD_STATUS} />}
                </span>
              </span>
            </Link>
            {!card && (
              <div className="border-t border-line p-2">
                <ButtonLink
                  variant="secondary"
                  icon={CreditCard}
                  to={`/members/${member.member_id}/link-card`}
                  className="w-full"
                >
                  Link card
                </ButtonLink>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
