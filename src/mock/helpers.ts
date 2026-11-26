// Helpers for building mock data relative to "now", so expiring and expired
// members stay correct whatever day you run the app.

import { addDays, todayInManila } from '../lib/format'
import type { DateString, Timestamp, Uuid } from '../types'

// Readable fake UUIDs: mockId(101) -> "00000000-0000-4000-8000-000000000101".
// Ranges per table: gym 1, users 11+, scanners 21+, plans 31+, batches 41+,
// members 101+, cards 201+, memberships 301+, payments 401+, check-ins 501+,
// link requests 601+, walk-ins 701+.
export function mockId(n: number): Uuid {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

// A calendar day relative to today in Manila: daysFromToday(-3) = 3 days ago.
export function daysFromToday(days: number): DateString {
  return addDays(todayInManila(), days)
}

// A timestamp this many minutes before now.
export function minutesAgo(minutes: number): Timestamp {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

// Like minutesAgo, but never earlier than today's midnight in Manila, for data
// that must count as "today". Shortly after midnight the times are squeezed
// into the hours that have passed, which keeps them in the same order.
const OLDEST_TODAY_MINUTES = 200

export function todayMinutesAgo(minutes: number): Timestamp {
  const midnight = Date.parse(`${todayInManila()}T00:00:00+08:00`)
  const minutesToday = (Date.now() - midnight) / 60_000
  const scale = Math.min(1, minutesToday / OLDEST_TODAY_MINUTES)
  return minutesAgo(minutes * scale)
}

// A timestamp this many seconds after now (for link request expiry).
export function secondsFromNow(seconds: number): Timestamp {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

// Pesos to centavos, so prices read naturally: pesos(1000) = 100000.
export function pesos(amount: number): number {
  return Math.round(amount * 100)
}
