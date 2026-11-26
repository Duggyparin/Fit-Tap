import { ArrowDown, ArrowUp, ArrowUpDown, CreditCard } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate } from '../lib/format'
import type { MemberRecord, MemberSort } from '../lib/members'
import { daysLeftText } from '../lib/status'
import ButtonLink from './ButtonLink'
import Icon from './Icon'
import MemberPhoto from './MemberPhoto'
import { MembershipBadge } from './StatusBadge'

const CELL = 'px-3 py-3'
// Between lg and xl there is not room for every column, so phone and plan move
// under the name.
const WIDE_ONLY = 'hidden xl:table-cell'

function SortHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string
  column: MemberSort['by']
  sort: MemberSort
  onSort: (sort: MemberSort) => void
}) {
  const active = sort.by === column
  const icon = !active ? ArrowUpDown : sort.ascending ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.ascending ? 'ascending' : 'descending') : 'none'}
      className="px-1 font-medium"
    >
      <button
        type="button"
        // Clicking the sorted column again reverses the order.
        onClick={() => onSort({ by: column, ascending: active ? !sort.ascending : true })}
        className="flex min-h-11 items-center gap-1 rounded px-2 hover:text-ink"
      >
        {label}
        <Icon icon={icon} size={14} />
      </button>
    </th>
  )
}

// The desktop view of the member list.
export default function MemberTable({
  records,
  sort,
  onSort,
}: {
  records: MemberRecord[]
  sort: MemberSort
  onSort: (sort: MemberSort) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-ink-muted">
          <tr>
            <SortHeader label="Name" column="name" sort={sort} onSort={onSort} />
            <th scope="col" className={`${CELL} ${WIDE_ONLY} font-medium`}>Phone</th>
            <th scope="col" className={`${CELL} ${WIDE_ONLY} font-medium`}>Plan</th>
            <SortHeader label="End date" column="end" sort={sort} onSort={onSort} />
            <th scope="col" className={`${CELL} font-medium`}>Days left</th>
            <th scope="col" className={`${CELL} font-medium`}>Status</th>
            <th scope="col" className={`${CELL} font-medium`}>Card number</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {records.map(({ member, plan, endDate, daysLeft, status, card }) => (
            <tr key={member.member_id} className="hover:bg-page">
              <td className={CELL}>
                <Link
                  to={`/members/${member.member_id}`}
                  className="flex min-h-11 items-center gap-3"
                >
                  <MemberPhoto member={member} size="sm" />
                  <span>
                    <span className="block font-semibold hover:underline">{member.full_name}</span>
                    <span className="block text-xs text-ink-muted xl:hidden">{member.phone}</span>
                    <span className="block text-xs text-ink-muted xl:hidden">
                      {plan?.plan_name ?? 'No plan'}
                    </span>
                  </span>
                </Link>
              </td>
              <td className={`${CELL} ${WIDE_ONLY} whitespace-nowrap`}>{member.phone}</td>
              <td className={`${CELL} ${WIDE_ONLY}`}>{plan?.plan_name ?? '—'}</td>
              <td className={`${CELL} whitespace-nowrap`}>{endDate ? formatDate(endDate) : '—'}</td>
              <td className={CELL}>
                {daysLeft === null || status === 'frozen' || status === 'cancelled'
                  ? '—'
                  : daysLeftText(daysLeft)}
              </td>
              <td className={CELL}>
                <MembershipBadge state={status} />
              </td>
              <td className={CELL}>
                {card ? (
                  <span className="whitespace-nowrap">{card.card_number ?? 'Plain card'}</span>
                ) : (
                  <ButtonLink
                    variant="secondary"
                    icon={CreditCard}
                    to={`/members/${member.member_id}/link-card`}
                    className="whitespace-nowrap"
                  >
                    Link card
                  </ButtonLink>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
