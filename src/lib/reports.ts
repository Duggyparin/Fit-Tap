// Date ranges, grouping and CSV for the Dashboard and Reports. All days and
// hours are in Asia/Manila.

import type { Checkin, DateString, Timestamp } from '../types'
import { TIME_ZONE } from './constants'
import { addDays, daysLeft, todayInManila } from './format'

export type RangePreset = 'today' | 'week' | 'month'

export interface Range {
  from: DateString
  to: DateString // inclusive
}

// "This week" starts on Monday; both week and month end today.
export function rangeFor(preset: RangePreset, today: DateString = todayInManila()): Range {
  if (preset === 'today') return { from: today, to: today }
  if (preset === 'month') return { from: `${today.slice(0, 8)}01`, to: today }
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return { from: addDays(today, -((weekday + 6) % 7)), to: today }
}

export function dayOf(value: Timestamp): DateString {
  return todayInManila(new Date(value))
}

export function inRange(value: Timestamp, range: Range): boolean {
  const day = dayOf(value)
  return day >= range.from && day <= range.to
}

export function daysIn(range: Range): DateString[] {
  const count = daysLeft(range.to, range.from) + 1
  return Array.from({ length: count }, (_, i) => addDays(range.from, i))
}

const hourFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  hourCycle: 'h23',
})

// 0-23 in Manila
export function hourOf(value: Timestamp): number {
  return Number(hourFormat.format(new Date(value)))
}

export function hourLabel(hour: number): string {
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`
}

// Allowed taps per hour, from 5 AM to 10 PM (wider if there are taps outside).
export function checkinsByHour(checkins: Checkin[]): { hour: number; count: number }[] {
  const hours = checkins.filter((c) => c.result === 'allowed').map((c) => hourOf(c.scanned_at))
  const first = Math.min(5, ...hours)
  const last = Math.max(22, ...hours)
  return Array.from({ length: last - first + 1 }, (_, i) => ({
    hour: first + i,
    count: hours.filter((h) => h === first + i).length,
  }))
}

// Unique members allowed in on each day of the range.
export function membersPerDay(checkins: Checkin[], range: Range) {
  // One pass over the check-ins, then one lookup per day.
  const members = new Map<DateString, Set<string | null>>()
  for (const c of checkins) {
    if (c.result !== 'allowed') continue
    const day = dayOf(c.scanned_at)
    if (!members.has(day)) members.set(day, new Set())
    members.get(day)!.add(c.member_id)
  }
  return daysIn(range).map((day) => ({ day, count: members.get(day)?.size ?? 0 }))
}

// ---------- CSV ----------

function csvCell(value: string): string {
  // A leading = + - @ would run as a formula in Excel, so prefix an apostrophe.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, rows: string[][]) {
  // The byte order mark makes Excel read names with ñ correctly.
  const blob = new Blob([String.fromCharCode(0xfeff), toCsv(rows)], {
    type: 'text/csv;charset=utf-8',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
