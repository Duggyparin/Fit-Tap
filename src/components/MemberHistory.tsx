import type { ReactNode } from 'react'
import type { MemberDetail } from '../lib/data'
import { formatDate, formatPeso, formatTime, todayInManila } from '../lib/format'
import { membershipState } from '../lib/membership'
import { METHOD_LABEL } from '../lib/payments'
import { CheckinBadge, MembershipBadge } from './StatusBadge'
import Tabs from './Tabs'

function List({ empty, rows }: { empty: string; rows: ReactNode[] }) {
  if (rows.length === 0) return <p className="p-4 text-sm text-ink-muted">{empty}</p>
  return <ul className="divide-y divide-line">{rows}</ul>
}

function Row({ title, detail, end }: { title: string; detail: string; end: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-ink-muted">{detail}</p>
      </div>
      {end}
    </li>
  )
}

// A member's memberships, payments and check-ins, newest first.
export default function MemberHistory({ member }: { member: MemberDetail }) {
  const today = todayInManila()

  return (
    <Tabs
      label="Member history"
      tabs={[
        {
          label: 'Memberships',
          content: (
            <List
              empty="No memberships yet."
              rows={member.memberships.map((m) => (
                <Row
                  key={m.membership_id}
                  title={m.planName}
                  detail={`${formatDate(m.start_date)} – ${formatDate(m.end_date)}`}
                  end={
                    // A renewal paid early has not started yet.
                    m.status === 'active' && m.start_date > today ? (
                      <span className="text-sm text-ink-muted">Starts later</span>
                    ) : (
                      <MembershipBadge state={membershipState(m, today)} />
                    )
                  }
                />
              ))}
            />
          ),
        },
        {
          label: 'Payments',
          content: (
            <List
              empty="No payments yet."
              rows={member.payments.map((p) => (
                <Row
                  key={p.payment_id}
                  title={`${p.planName} · ${METHOD_LABEL[p.method]}`}
                  detail={`${formatDate(p.paid_at)}${p.reference_no ? ` · ${p.reference_no}` : ''}`}
                  end={<span className="font-semibold">{formatPeso(p.amount_centavos)}</span>}
                />
              ))}
            />
          ),
        },
        {
          label: 'Check-ins',
          content: (
            <List
              empty="No check-ins yet."
              rows={member.checkins.map((c) => (
                <Row
                  key={c.checkin_id}
                  title={formatDate(c.scanned_at)}
                  detail={formatTime(c.scanned_at)}
                  end={<CheckinBadge result={c.result} source={c.source} />}
                />
              ))}
            />
          ),
        },
      ]}
    />
  )
}
