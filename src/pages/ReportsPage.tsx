import { Download } from 'lucide-react'
import { useState } from 'react'
import BarChart from '../components/BarChart'
import Button from '../components/Button'
import ExpiringList from '../components/ExpiringList'
import FilterChips from '../components/FilterChips'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import { EXPIRING_DAYS } from '../lib/constants'
import { useIsOwner, useReport } from '../lib/data'
import { formatDate, formatPeso, formatRange, formatTime } from '../lib/format'
import { METHOD_LABEL } from '../lib/payments'
import {
  checkinsByHour,
  dayOf,
  downloadCsv,
  hourLabel,
  membersPerDay,
  rangeFor,
  type RangePreset,
} from '../lib/reports'
import { CHECKIN_STATUS, SOURCE_LABEL } from '../lib/status'

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

const checkinCount = (n: number) => `${n} ${n === 1 ? 'check-in' : 'check-ins'}`
const memberCount = (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`

export default function ReportsPage() {
  const [preset, setPreset] = useState<RangePreset>('month')
  const range = rangeFor(preset)
  const report = useReport(range).data
  const isOwner = useIsOwner()
  const { totals } = report
  const days = membersPerDay(report.checkins, range)
  const allowed = report.checkins.filter((c) => c.result === 'allowed').length
  const fileDates = `${range.from}_to_${range.to}`

  function exportPayments() {
    downloadCsv(`fittap-payments-${fileDates}.csv`, [
      ['Date', 'Time', 'Type', 'Name', 'Plan', 'Amount (PHP)', 'Method', 'Reference'],
      ...report.income.map((row) => [
        dayOf(row.at),
        formatTime(row.at),
        row.kind === 'membership' ? 'Membership' : 'Walk-in',
        row.name,
        row.plan,
        (row.amountCentavos / 100).toFixed(2),
        METHOD_LABEL[row.method],
        row.reference ?? '',
      ]),
    ])
  }

  function exportCheckins() {
    downloadCsv(`fittap-checkins-${fileDates}.csv`, [
      ['Date', 'Time', 'Member', 'Result', 'Source', 'Scanner', 'Card UID'],
      ...report.checkins.map((c) => [
        dayOf(c.scanned_at),
        formatTime(c.scanned_at),
        c.memberName,
        CHECKIN_STATUS[c.result].label,
        SOURCE_LABEL[c.source],
        c.scannerName,
        c.card_uid ?? '',
      ]),
    ])
  }

  const share = (part: number) => (totals.total ? (part / totals.total) * 100 : 0)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header>
        <h1 className="text-2xl font-bold text-navy">Reports</h1>
        <p className="text-sm text-ink-muted">{formatRange(range.from, range.to)}</p>
      </header>
      <FilterChips label="Report range" options={PRESETS} value={preset} onChange={setPreset} />

      <div className="grid grid-cols-2 gap-2 lg:gap-4">
        <KpiCard label="Check-ins" value={allowed} hint="Allowed entries" />
        {isOwner ? (
          <KpiCard
            label="Total income"
            value={formatPeso(totals.total)}
            hint={`${totals.walkInCount} walk-ins`}
          />
        ) : (
          <KpiCard label="Walk-ins" value={totals.walkInCount} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        {isOwner && (
          <Panel title="Income">
            <ul className="flex flex-col gap-4 p-4">
              {[
                { label: 'Memberships', value: totals.memberships },
                { label: 'Walk-ins', value: totals.walkIns },
              ].map((row) => (
                <li key={row.label}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span>{row.label}</span>
                    <strong>{formatPeso(row.value)}</strong>
                  </div>
                  <div aria-hidden="true" className="h-3 rounded bg-page">
                    <div
                      className="h-full rounded bg-navy"
                      style={{ width: `${share(row.value)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel title="Members checked in per day">
          <div className="p-4">
            <BarChart
              unit={memberCount}
              labelEvery={days.length > 10 ? 7 : 1}
              bars={days.map((d) => ({
                key: d.day,
                axis: formatDate(d.day).replace(/, \d{4}$/, ''),
                name: formatDate(d.day),
                value: d.count,
              }))}
            />
          </div>
        </Panel>

        <Panel title="Peak hours">
          <div className="p-4">
            <BarChart
              labelEvery={3}
              unit={checkinCount}
              bars={checkinsByHour(report.checkins).map((h) => ({
                key: String(h.hour),
                axis: hourLabel(h.hour),
                name: hourLabel(h.hour),
                value: h.count,
              }))}
            />
          </div>
        </Panel>

        <Panel title={`Expiring in ${EXPIRING_DAYS} days`}>
          <ExpiringList />
        </Panel>
      </div>

      <Panel title="Export CSV">
        <div className="flex flex-wrap gap-2 p-4">
          {isOwner && (
            <Button
              variant="secondary"
              icon={Download}
              onClick={exportPayments}
              disabled={report.income.length === 0}
            >
              Payments ({report.income.length})
            </Button>
          )}
          <Button
            variant="secondary"
            icon={Download}
            onClick={exportCheckins}
            disabled={report.checkins.length === 0}
          >
            Check-ins ({report.checkins.length})
          </Button>
        </div>
      </Panel>
    </div>
  )
}
