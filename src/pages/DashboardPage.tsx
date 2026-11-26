import { ChevronRight, Nfc } from 'lucide-react'
import { Link } from 'react-router'
import BarChart from '../components/BarChart'
import CheckinItem from '../components/CheckinItem'
import EmptyState from '../components/EmptyState'
import ExpiringList from '../components/ExpiringList'
import Icon from '../components/Icon'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import { EXPIRING_DAYS } from '../lib/constants'
import {
  useCheckinSummary,
  useCurrentUser,
  useReport,
  useScanners,
  useTodayCheckins,
} from '../lib/data'
import { formatAgo, formatDate, formatPeso, todayInManila } from '../lib/format'
import { checkinsByHour, hourLabel, rangeFor } from '../lib/reports'
import { scannerLook } from '../lib/status'
import { useNow } from '../lib/useNow'

function More({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
      {children}
      <Icon icon={ChevronRight} size={16} />
    </Link>
  )
}

export default function DashboardPage() {
  const now = useNow(30_000)
  const summary = useCheckinSummary().data
  const today = useTodayCheckins().data
  const scanners = useScanners().data
  const month = useReport(rangeFor('month')).data
  const isOwner = useCurrentUser().data.role === 'owner'
  const hours = checkinsByHour(today.map((v) => v.checkin))

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header>
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-sm text-ink-muted">{formatDate(todayInManila())}</p>
      </header>

      <div className={`grid grid-cols-2 gap-2 lg:gap-4 ${isOwner ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        <KpiCard label="Today’s check-ins" value={summary.membersIn} hint="Unique members" />
        <KpiCard label="Active members" value={summary.activeMembers} />
        <KpiCard label={`Expiring in ${EXPIRING_DAYS} days`} value={summary.expiring} />
        {isOwner && (
          <KpiCard
            label="This month’s income"
            value={formatPeso(month.totals.total)}
            hint="Memberships and walk-ins"
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <Panel title="Live check-ins" action={<More to="/checkins">View all</More>}>
          {today.length === 0 ? (
            <EmptyState icon={Nfc} title="No check-ins yet today" text="New card taps will appear here." />
          ) : (
            <ul className="divide-y divide-line">
              {today.slice(0, 5).map((view) => (
                <li key={view.checkin.checkin_id}>
                  <CheckinItem view={view} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Expiring soon" action={<More to="/members">Members</More>}>
          <ExpiringList />
        </Panel>

        <Panel title="Check-ins by hour today">
          <div className="p-4">
            <BarChart
              labelEvery={3}
              unit={(n) => `${n} ${n === 1 ? 'check-in' : 'check-ins'}`}
              bars={hours.map((h) => ({
                key: String(h.hour),
                axis: hourLabel(h.hour),
                name: hourLabel(h.hour),
                value: h.count,
              }))}
            />
          </div>
        </Panel>

        <Panel title="Scanner status" action={<More to="/scanners">Scanners</More>}>
          <ul className="divide-y divide-line">
            {scanners.map(({ scanner, online }) => (
              <li key={scanner.scanner_id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{scanner.scanner_name}</p>
                  <p className="text-sm text-ink-muted">
                    {scanner.last_seen_at
                      ? `Last seen ${formatAgo(scanner.last_seen_at, now)}`
                      : 'Never seen'}
                  </p>
                </div>
                <StatusBadge {...scannerLook(online)} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
