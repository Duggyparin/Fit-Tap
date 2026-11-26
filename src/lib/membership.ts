// Membership rules: how long a plan lasts, where a renewal starts, and what
// state to show. Dates are calendar days in Asia/Manila.
//
// end_date is the LAST day the member may enter (inclusive). The check-in
// function allows entry while end_date >= today, so:
//   Daily (1 day) bought today    -> start = today, end = today
//   Monthly (30 days) from Nov 26 -> end = Dec 25 (Nov 26..Dec 25 is 30 days)

import { addDays, isExpired, isExpiring, todayInManila } from './format'
import type { DateString, Membership } from '../types'

// endDateFor("2026-11-26", 30) -> "2026-12-25"
export function endDateFor(start: DateString, durationDays: number): DateString {
  return addDays(start, durationDays - 1)
}

// Where a new or renewed membership starts.
// - The current membership is active or frozen and has not ended yet:
//   start the day after it ends, so the member loses no days.
// - Otherwise (no membership, expired or cancelled): start today.
export function renewalStartFor(
  current: Pick<Membership, 'status' | 'end_date'> | null,
  today: DateString = todayInManila(),
): DateString {
  const stillRunning =
    current !== null &&
    (current.status === 'active' || current.status === 'frozen') &&
    current.end_date >= today // YYYY-MM-DD strings compare correctly as text
  return stillRunning ? addDays(current.end_date, 1) : today
}

// What the UI shows for a membership. 'expired' is worked out from end_date,
// never stored (see docs/schema-todo.md).
export type MembershipState = 'active' | 'expiring' | 'expired' | 'frozen' | 'cancelled'

export function membershipState(
  m: Pick<Membership, 'status' | 'end_date'>,
  today: DateString = todayInManila(),
): MembershipState {
  if (m.status === 'cancelled') return 'cancelled'
  if (m.status === 'frozen') return 'frozen'
  if (isExpired(m.end_date, today)) return 'expired'
  if (isExpiring(m.end_date, today)) return 'expiring'
  return 'active'
}

// Can this member get in today? Looks at ALL of one member's memberships.
// - Any frozen membership that has not ended: frozen.
// - Otherwise the LATEST end date counts, so someone who already renewed is not
//   "expiring" just because the current period ends soon.
// - Nothing running (expired, cancelled or no membership): expired.
export function memberAccess(
  memberships: Pick<Membership, 'status' | 'end_date'>[],
  today: DateString = todayInManila(),
): 'active' | 'expiring' | 'expired' | 'frozen' {
  const running = memberships.filter((m) => m.status !== 'cancelled' && m.end_date >= today)
  if (running.some((m) => m.status === 'frozen')) return 'frozen'
  if (running.length === 0) return 'expired'
  const lastEnd = running.map((m) => m.end_date).sort().at(-1)!
  return isExpiring(lastEnd, today) ? 'expiring' : 'active'
}
