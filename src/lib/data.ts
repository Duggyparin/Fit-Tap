// The only place the screens get their data from. Today it reads the mock data;
// later these hooks will query Supabase and keep the same shape, so the pages
// do not need to change.

import { useMemo, useSyncExternalStore } from 'react'
import {
  checkins as mockCheckins,
  GYM_ID,
  members,
  memberships,
  nfcCards,
  payments,
  plans,
  scanners,
} from '../mock'
import { mockId } from '../mock/helpers'
import { randomCheckin } from '../mock/simulate'
import type { Checkin, Member, Membership, Payment } from '../types'
import { summarizeCheckins, type CheckinSummary } from './checkins'
import { todayInManila } from './format'
import { buildMemberRecord, canEnter, type MemberRecord } from './members'
import { memberAccess } from './membership'

// Every hook returns this. Mock data is instant, so isLoading is always false.
export interface Query<T> {
  data: T
  isLoading: boolean
}

// A check-in joined with what the screen needs to show it.
export interface CheckinView {
  checkin: Checkin
  member: Member | null // null = unknown card
  scannerName: string | null // null = manual check-in
}

// ---------- In-memory check-in store (resets when the page reloads) ----------

let checkinStore: Checkin[] = mockCheckins
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setCheckins(next: Checkin[]) {
  checkinStore = next
  listeners.forEach((listener) => listener())
}

function useCheckins(): Checkin[] {
  return useSyncExternalStore(subscribe, () => checkinStore)
}

function isToday(c: Checkin): boolean {
  return todayInManila(new Date(c.scanned_at)) === todayInManila()
}

function newestFirst(a: Checkin, b: Checkin): number {
  return b.scanned_at.localeCompare(a.scanned_at)
}

function recordFor(member: Member): MemberRecord {
  return buildMemberRecord(member, memberships, plans, nfcCards)
}

function planName(planId: string): string {
  return plans.find((p) => p.plan_id === planId)?.plan_name ?? 'Unknown plan'
}

// ---------- Check-in hooks ----------

// Today's taps in Manila, newest first.
export function useTodayCheckins(): Query<CheckinView[]> {
  const checkins = useCheckins()
  const data = useMemo(
    () =>
      checkins
        .filter(isToday)
        .sort(newestFirst)
        .map((checkin) => ({
          checkin,
          member: members.find((m) => m.member_id === checkin.member_id) ?? null,
          scannerName:
            scanners.find((s) => s.scanner_id === checkin.scanner_id)?.scanner_name ?? null,
        })),
    [checkins],
  )
  return { data, isLoading: false }
}

export interface Summary extends CheckinSummary {
  activeMembers: number // can enter today, including those expiring soon
  expiring: number
}

export function useCheckinSummary(): Query<Summary> {
  const checkins = useCheckins()
  const data = useMemo(() => {
    const records = members
      .filter((m) => m.status === 'active') // archived members are left out
      .map(recordFor)
    return {
      ...summarizeCheckins(checkins.filter(isToday)),
      activeMembers: records.filter((r) => canEnter(r.status)).length,
      expiring: records.filter((r) => r.status === 'expiring').length,
    }
  }, [checkins])
  return { data, isLoading: false }
}

// ---------- Member hooks ----------

// All members except archived ones.
export function useMembers(): Query<MemberRecord[]> {
  const data = useMemo(() => members.filter((m) => m.status === 'active').map(recordFor), [])
  return { data, isLoading: false }
}

export interface MemberDetail extends MemberRecord {
  memberships: (Membership & { planName: string })[] // newest first
  payments: (Payment & { planName: string })[] // newest first
  checkins: Checkin[] // newest first
}

// data is null when no member has this id.
export function useMember(id: string | undefined): Query<MemberDetail | null> {
  const checkins = useCheckins()
  const data = useMemo(() => {
    const member = members.find((m) => m.member_id === id)
    if (!member) return null
    const own = memberships
      .filter((m) => m.member_id === id)
      .sort((a, b) => b.start_date.localeCompare(a.start_date))
      .map((m) => ({ ...m, planName: planName(m.plan_id) }))
    return {
      ...recordFor(member),
      memberships: own,
      payments: payments
        .flatMap((p) => {
          const membership = own.find((m) => m.membership_id === p.membership_id)
          return membership ? [{ ...p, planName: membership.planName }] : []
        })
        .sort((a, b) => b.paid_at.localeCompare(a.paid_at)),
      checkins: checkins.filter((c) => c.member_id === id).sort(newestFirst),
    }
  }, [id, checkins])
  return { data, isLoading: false }
}

// ---------- Actions ----------

let manualCount = 800_000 // keeps these IDs apart from the fixed mock IDs

// Records a check-in made by staff. Returns null (and saves nothing) if the
// member may not enter today.
export function addManualCheckin(memberId: string): Checkin | null {
  const access = memberAccess(memberships.filter((m) => m.member_id === memberId))
  if (access !== 'active' && access !== 'expiring') return null

  manualCount += 1
  const now = new Date().toISOString()
  const checkin: Checkin = {
    checkin_id: mockId(manualCount),
    gym_id: GYM_ID,
    member_id: memberId,
    scanner_id: null,
    card_uid: null,
    result: 'allowed',
    source: 'manual',
    scanned_at: now,
    synced_at: now,
  }
  setCheckins([checkin, ...checkinStore])
  return checkin
}

// ---------- Development only ----------
// Call these only behind `import.meta.env.DEV`, so production builds drop them.

export function simulateTap() {
  setCheckins([randomCheckin(), ...checkinStore])
}

export function clearCheckins() {
  setCheckins([])
}
