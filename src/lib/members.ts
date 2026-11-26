// Rules for the member screens: what to show for each member, plus search,
// filters and sorting.

import type { DateString, Member, Membership, NfcCard, Plan } from '../types'
import { daysLeft, todayInManila } from './format'
import { memberAccess, type MembershipState } from './membership'

// One member with everything the list and profile need.
export interface MemberRecord {
  member: Member
  status: MembershipState
  plan: Plan | null // plan of the membership that applies now
  endDate: DateString | null // the last day they may enter (latest, if renewed early)
  daysLeft: number | null
  card: NfcCard | null // only an ACTIVE card counts
}

export function buildMemberRecord(
  member: Member,
  allMemberships: Membership[],
  plans: Plan[],
  cards: NfcCard[],
  today: DateString = todayInManila(),
): MemberRecord {
  const own = allMemberships
    .filter((m) => m.member_id === member.member_id)
    .sort((a, b) => a.end_date.localeCompare(b.end_date))
  const running = own.filter((m) => m.status !== 'cancelled' && m.end_date >= today)
  const newest = own.at(-1) ?? null

  // The membership that applies now: a frozen one, else the one covering today,
  // else the next one. With nothing running, the most recent one.
  const current =
    running.find((m) => m.status === 'frozen') ??
    running.find((m) => m.start_date <= today) ??
    running[0] ??
    newest
  const endDate = running.at(-1)?.end_date ?? current?.end_date ?? null

  const access = memberAccess(own, today)
  const status: MembershipState =
    access === 'expired' && newest?.status === 'cancelled' ? 'cancelled' : access

  return {
    member,
    status,
    plan: plans.find((p) => p.plan_id === current?.plan_id) ?? null,
    endDate,
    daysLeft: endDate ? daysLeft(endDate, today) : null,
    card: cards.find((c) => c.member_id === member.member_id && c.status === 'active') ?? null,
  }
}

export function canEnter(status: MembershipState): boolean {
  return status === 'active' || status === 'expiring'
}

// ---------- Search ----------

// Matches part of the name, or part of the phone number ignoring spaces.
// "+63 917..." is treated like "0917...".
export function matchesSearch(member: Member, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (member.full_name.toLowerCase().includes(q)) return true
  if (!/^[\d\s()+-]+$/.test(q)) return false
  const digits = q.replace(/\D/g, '').replace(/^63/, '0')
  return digits !== '' && member.phone.replace(/\D/g, '').includes(digits)
}

// ---------- Philippine mobile numbers: 09XX XXX XXXX ----------

// Formats while typing. Accepts "+63 9..." and turns it into "09...".
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^63(?=9)/, '0').slice(0, 11)
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter(Boolean).join(' ')
}

export function isValidPhone(value: string): boolean {
  return /^09\d{2} \d{3} \d{4}$/.test(value)
}

// ---------- Filters ----------

export type MemberFilter = 'all' | 'active' | 'expiring' | 'expired' | 'frozen' | 'no-card'

export function matchesMemberFilter(record: MemberRecord, filter: MemberFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'active': // can get in today, including those expiring soon
      return canEnter(record.status)
    case 'expired': // cancelled members cannot get in either
      return record.status === 'expired' || record.status === 'cancelled'
    case 'no-card':
      return record.card === null
    default:
      return record.status === filter
  }
}

// ---------- Sorting ----------

export interface MemberSort {
  by: 'name' | 'end'
  ascending: boolean
}

export function sortMembers(records: MemberRecord[], sort: MemberSort): MemberRecord[] {
  const direction = sort.ascending ? 1 : -1
  const byName = (a: MemberRecord, b: MemberRecord) =>
    a.member.full_name.localeCompare(b.member.full_name)

  return [...records].sort((a, b) => {
    if (sort.by === 'name') return direction * byName(a, b)
    // Members without an end date always go last.
    if (!a.endDate || !b.endDate) return Number(!a.endDate) - Number(!b.endDate)
    return direction * a.endDate.localeCompare(b.endDate) || byName(a, b)
  })
}
