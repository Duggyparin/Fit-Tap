import { Bell, ChevronRight, CircleCheck, Clock, CreditCard, Store, WifiOff } from 'lucide-react'
import { Link } from 'react-router'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import KpiCard from '../../components/KpiCard'
import PageHeader from '../../components/PageHeader'
import Panel from '../../components/Panel'
import StatusBadge from '../../components/StatusBadge'
import { useOverview, type Alert } from '../../lib/adminData'
import { formatDate, todayInManila } from '../../lib/format'
import { GYM_STATUS } from '../../lib/status'

const ALERT_ICON: Record<Alert['kind'], typeof Bell> = {
  scanner: WifiOff,
  quiet: Clock,
  overdue: CreditCard,
  onboarding: Store,
}

export default function AdminOverviewPage() {
  const overview = useOverview().data

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:gap-6">
      <PageHeader title="Overview" subtitle={formatDate(todayInManila())} />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
        <KpiCard label="Active members (all gyms)" value={overview.activeMembers} />
        <KpiCard label="Check-ins today (all gyms)" value={overview.checkinsToday} />
        <KpiCard label="Scanners offline" value={overview.scannersOffline} />
        <KpiCard label="Overdue gyms" value={overview.overdueGyms} />
      </div>

      <Panel title="Gyms by status">
        <ul className="grid grid-cols-3 divide-x divide-line">
          {(['active', 'trial', 'suspended'] as const).map((status) => (
            <li key={status} className="flex flex-col items-center gap-2 p-4">
              <span className="text-3xl font-bold text-navy">{overview.byStatus[status]}</span>
              <StatusBadge {...GYM_STATUS[status]} />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={`Alerts (${overview.alerts.length})`}>
        {overview.alerts.length === 0 ? (
          <EmptyState icon={CircleCheck} title="All clear" text="Nothing needs your attention." />
        ) : (
          <ul className="divide-y divide-line">
            {overview.alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  to={`/admin/gyms/${alert.gymId}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-page"
                >
                  <Icon icon={ALERT_ICON[alert.kind]} className="shrink-0 text-warning" />
                  <span className="min-w-0 flex-1 text-sm">{alert.text}</span>
                  <Icon icon={ChevronRight} size={18} className="shrink-0 text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
