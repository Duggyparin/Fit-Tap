import { Nfc, Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button'
import CheckinHistoryTable from '../components/CheckinHistoryTable'
import CheckinItem from '../components/CheckinItem'
import EmptyState from '../components/EmptyState'
import FilterChips from '../components/FilterChips'
import KpiCard from '../components/KpiCard'
import ManualCheckinDialog from '../components/ManualCheckinDialog'
import { matchesFilter, summaryHint, type CheckinFilter } from '../lib/checkins'
import { EXPIRING_DAYS } from '../lib/constants'
import { clearCheckins, simulateTap, useCheckinSummary, useTodayCheckins } from '../lib/data'
import { formatDate, todayInManila } from '../lib/format'

const FILTERS: { value: CheckinFilter; label: string; empty: string }[] = [
  { value: 'all', label: 'All', empty: 'No check-ins yet today' },
  { value: 'allowed', label: 'Allowed', empty: 'No allowed check-ins today' },
  { value: 'denied', label: 'Denied', empty: 'No denied check-ins today' },
  { value: 'unknown', label: 'Unknown', empty: 'No unknown cards today' },
]

export default function CheckinsPage() {
  const [filter, setFilter] = useState<CheckinFilter>('all')
  const [checkingIn, setCheckingIn] = useState(false)
  const today = useTodayCheckins()
  const summary = useCheckinSummary()

  const shown = today.data.filter((v) => matchesFilter(v.checkin.result, filter))
  const [latest, ...earlier] = shown
  const count = (value: number) => (summary.isLoading ? '–' : value)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Check-ins</h1>
          <p className="text-sm text-ink-muted">{formatDate(todayInManila())}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Test buttons: not included in the production build. */}
          {import.meta.env.DEV && (
            <>
              <Button variant="secondary" onClick={simulateTap}>
                Simulate tap
              </Button>
              <Button variant="secondary" onClick={clearCheckins}>
                Clear feed
              </Button>
            </>
          )}
          <Button icon={Plus} onClick={() => setCheckingIn(true)}>
            Manual check-in
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 lg:gap-4">
        <KpiCard
          label="Today’s check-ins"
          value={count(summary.data.membersIn)}
          hint={summaryHint(summary.data)}
        />
        <KpiCard label="Active members" value={count(summary.data.activeMembers)} />
        <KpiCard label={`Expiring in ${EXPIRING_DAYS} days`} value={count(summary.data.expiring)} />
      </div>

      <FilterChips label="Filter check-ins" options={FILTERS} value={filter} onChange={setFilter} />

      {today.isLoading ? (
        <p className="text-sm text-ink-muted">Loading check-ins…</p>
      ) : !latest ? (
        <EmptyState
          icon={Nfc}
          title={
            today.data.length === 0
              ? FILTERS[0].empty
              : FILTERS.find((f) => f.value === filter)!.empty
          }
          text="New card taps will appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
          <section aria-label="Live feed" className="flex min-w-0 flex-col gap-4">
            <div aria-live="polite">
              <CheckinItem key={latest.checkin.checkin_id} view={latest} featured />
            </div>
            {earlier.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-line bg-card">
                {earlier.map((view) => (
                  <li key={view.checkin.checkin_id}>
                    <CheckinItem view={view} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label="History" className="hidden min-w-0 lg:block">
            <CheckinHistoryTable views={shown} />
          </section>
        </div>
      )}

      {checkingIn && <ManualCheckinDialog onClose={() => setCheckingIn(false)} />}
    </div>
  )
}
