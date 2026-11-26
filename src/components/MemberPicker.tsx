import { SearchX } from 'lucide-react'
import { useState } from 'react'
import { useMembers } from '../lib/data'
import { matchesSearch, sortMembers } from '../lib/members'
import DaysLeftBadge from './DaysLeftBadge'
import EmptyState from './EmptyState'
import MemberPhoto from './MemberPhoto'
import SearchInput from './SearchInput'

// Search for a member and pick one (manual check-in and Renew).
export default function MemberPicker({
  onSelect,
  autoFocus = false,
}: {
  onSelect: (memberId: string) => void
  autoFocus?: boolean // only works inside a <Modal>
}) {
  const members = useMembers()
  const [query, setQuery] = useState('')
  const records = sortMembers(
    members.data.filter((r) => matchesSearch(r.member, query)),
    { by: 'name', ascending: true },
  )

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        autoFocus={autoFocus}
        label="Search member"
        placeholder="Search by name or phone"
        value={query}
        onChange={setQuery}
      />
      {records.length === 0 ? (
        <EmptyState icon={SearchX} title="No member found" text="Check the spelling or number." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
          {records.map((record) => (
            <li key={record.member.member_id}>
              <button
                type="button"
                onClick={() => onSelect(record.member.member_id)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-page"
              >
                <MemberPhoto member={record.member} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{record.member.full_name}</span>
                  <span className="block text-sm text-ink-muted">{record.member.phone}</span>
                </span>
                <DaysLeftBadge record={record} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
