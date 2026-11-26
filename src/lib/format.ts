// Formatting and date helpers. Everything uses Asia/Manila time, so a staff
// phone set to another time zone still shows the gym's dates and times.

import { EXPIRING_DAYS, TIME_ZONE } from './constants'
import type { DateString, Timestamp } from '../types'

// ---------- Money ----------

// 150000 -> "₱1,500"   150050 -> "₱1,500.50"   -10000 -> "-₱100"
export function formatPeso(centavos: number): string {
  const sign = centavos < 0 ? '-' : ''
  const abs = Math.abs(centavos)
  const hasCents = abs % 100 !== 0
  const amount = (abs / 100).toLocaleString('en-PH', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })
  return `${sign}₱${amount}`
}

// ---------- Calendar days ----------

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

// Today's date in Manila as "2026-11-26". Pass `now` to test other moments.
export function todayInManila(now: Date = new Date()): DateString {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return now.toLocaleDateString('en-CA', { timeZone: TIME_ZONE })
}

// Turns "2026-11-26" into a whole day number, so two dates can be subtracted
// without time zones or daylight saving getting in the way.
function dayNumber(date: DateString): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

// addDays("2026-11-26", 30) -> "2026-12-26"
export function addDays(date: DateString, days: number): DateString {
  const ms = (dayNumber(date) + days) * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

// Days from today to the end date. Same rule as the check-in function:
// 0 = today is the last day, negative = expired.
export function daysLeft(endDate: DateString, today: DateString = todayInManila()): number {
  return dayNumber(endDate) - dayNumber(today)
}

export function isExpired(endDate: DateString, today: DateString = todayInManila()): boolean {
  return daysLeft(endDate, today) < 0
}

// Still valid, but EXPIRING_DAYS days or fewer left (today counts as 0).
export function isExpiring(endDate: DateString, today: DateString = todayInManila()): boolean {
  const left = daysLeft(endDate, today)
  return left >= 0 && left <= EXPIRING_DAYS
}

// ---------- Showing dates and times ----------

const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

// A calendar day like "2026-11-26" is formatted as that exact day (as UTC),
// so it never shifts by a day. A timestamp is converted to Manila time.
const calendarFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

// "2026-11-26" or a timestamp -> "Nov 26, 2026"
export function formatDate(value: DateString | Timestamp): string {
  if (DATE_ONLY.test(value)) return calendarFormat.format(new Date(`${value}T00:00:00Z`))
  return dateFormat.format(new Date(value))
}

const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

// Timestamp -> "3:42 PM" in Manila time
export function formatTime(value: Timestamp): string {
  // Newer browsers put a narrow no-break space before AM/PM. \s matches any
  // kind of space, so this turns it into a normal one.
  return timeFormat.format(new Date(value)).replace(/\s/g, ' ')
}

// "just now", "4 min ago", "3 hr ago", "2 days ago"
export function formatAgo(value: Timestamp, now: number = Date.now()): string {
  const minutes = Math.floor((now - Date.parse(value)) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

// "Nov 26 to Dec 25, 2026 (30 days)"; the first year is shown only if it
// differs. A single day is "Nov 26, 2026 (1 day)".
export function formatRange(start: DateString, end: DateString): string {
  const days = daysLeft(end, start) + 1
  const length = `(${days} ${days === 1 ? 'day' : 'days'})`
  if (start === end) return `${formatDate(start)} ${length}`
  const sameYear = start.slice(0, 4) === end.slice(0, 4)
  const from = sameYear ? formatDate(start).replace(/, \d{4}$/, '') : formatDate(start)
  return `${from} to ${formatDate(end)} ${length}`
}
