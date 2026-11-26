import { Plus, SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Button from '../components/Button'
import ButtonLink from '../components/ButtonLink'
import EmptyState from '../components/EmptyState'
import FilterChips from '../components/FilterChips'
import Icon from '../components/Icon'
import MemberCardList from '../components/MemberCardList'
import MemberTable from '../components/MemberTable'
import SearchInput from '../components/SearchInput'
import { useMembers } from '../lib/data'
import {
  matchesMemberFilter,
  matchesRecord,
  sortMembers,
  type MemberFilter,
  type MemberSort,
} from '../lib/members'

const FILTERS: { value: MemberFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'no-card', label: 'No card' },
]

export default function MembersPage() {
  const members = useMembers()
  // The search lives in the address (/members?q=...), so the top bar can set
  // it and "Back" from a profile keeps it.
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const setQuery = (q: string) => setParams(q ? { q } : {}, { replace: true })
  const [filter, setFilter] = useState<MemberFilter>('all')
  const [sort, setSort] = useState<MemberSort>({ by: 'name', ascending: true })

  const shown = sortMembers(
    members.data.filter(
      (r) => matchesRecord(r, query) && matchesMemberFilter(r, filter),
    ),
    sort,
  )

  function reset() {
    setQuery('')
    setFilter('all')
  }

  return (
    // Extra bottom space on phones so the "+" button does not cover a card.
    <div className="flex flex-col gap-4 pb-20 lg:gap-6 lg:pb-0">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Members</h1>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {members.isLoading
              ? 'Loading members…'
              : `${shown.length} of ${members.data.length} members`}
          </p>
        </div>
        <div className="hidden lg:block">
          <ButtonLink to="/members/new" icon={Plus}>
            Add member
          </ButtonLink>
        </div>
      </header>

      <SearchInput
        label="Search members"
        placeholder="Name, phone, or card number"
        value={query}
        onChange={setQuery}
      />
      <FilterChips label="Filter members" options={FILTERS} value={filter} onChange={setFilter} />

      {members.isLoading ? null : shown.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No members found"
          text="Try another name, number or filter."
          action={
            <Button variant="secondary" onClick={reset}>
              Clear search and filter
            </Button>
          }
        />
      ) : (
        <>
          <div className="lg:hidden">
            <MemberCardList records={shown} />
          </div>
          <div className="hidden lg:block">
            <MemberTable records={shown} sort={sort} onSort={setSort} />
          </div>
        </>
      )}

      {/* Floating button, phone and tablet only; sits above the tab bar. */}
      <Link
        to="/members/new"
        aria-label="Add member"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] flex size-14 items-center justify-center rounded-full bg-primary text-card shadow-lg hover:bg-primary-hover lg:hidden"
      >
        <Icon icon={Plus} size={28} />
      </Link>
    </div>
  )
}
