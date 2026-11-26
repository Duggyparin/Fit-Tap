// The only place the screens get their data from. Today it reads and writes an
// in-memory copy of the mock data; later these hooks and actions will talk to
// Supabase and keep the same shape, so the pages do not need to change.

import { useMemo, useSyncExternalStore } from 'react'
import * as mock from '../mock'
import { mockId } from '../mock/helpers'
import { randomCheckin } from '../mock/simulate'
import type { AppUser, Checkin, Gym, Member, Membership, Payment, Plan } from '../types'
import { summarizeCheckins, type CheckinSummary } from './checkins'
import { todayInManila } from './format'
import { buildMemberRecord, canEnter, type MemberRecord } from './members'
import { endDateFor, memberAccess } from './membership'
import { savedReference, type PaymentInput } from './payments'

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

// ---------- In-memory store (resets when the page reloads) ----------

const initialDb = {
  gym: mock.gym,
  appUsers: mock.appUsers,
  members: mock.members,
  memberships: mock.memberships,
  payments: mock.payments,
  cards: mock.nfcCards,
  checkins: mock.checkins,
  linkRequests: mock.linkRequests,
  walkIns: mock.walkIns,
  plans: mock.plans,
  scanners: mock.scanners,
  cardBatches: mock.cardBatches,
}

type Db = typeof initialDb

let db: Db = initialDb
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(changes: Partial<Db>) {
  db = { ...db, ...changes }
  listeners.forEach((listener) => listener())
}

function useDb(): Db {
  return useSyncExternalStore(subscribe, () => db)
}

let idCount = 800_000 // keeps new IDs apart from the fixed mock IDs
function newId() {
  idCount += 1
  return mockId(idCount)
}

// Until login exists, the owner is the signed-in user.
function currentUserId() {
  return mock.OWNER_ID
}

// ---------- Helpers ----------

function isToday(c: Checkin): boolean {
  return todayInManila(new Date(c.scanned_at)) === todayInManila()
}

function newestFirst(a: Checkin, b: Checkin): number {
  return b.scanned_at.localeCompare(a.scanned_at)
}

function recordsOf(data: Db): MemberRecord[] {
  return data.members
    .filter((m) => m.gym_id === data.gym.gym_id && m.status === 'active')
    .map((m) => buildMemberRecord(m, data.memberships, data.plans, data.cards))
}

function planName(data: Db, planId: string): string {
  return data.plans.find((p) => p.plan_id === planId)?.plan_name ?? 'Unknown plan'
}

// ---------- Gym and user ----------

export function useGym(): Query<Gym> {
  return { data: useDb().gym, isLoading: false }
}

export function useCurrentUser(): Query<AppUser> {
  const users = useDb().appUsers
  return { data: users.find((u) => u.user_id === currentUserId())!, isLoading: false }
}

// ---------- Check-ins ----------

// Today's taps in Manila, newest first.
export function useTodayCheckins(): Query<CheckinView[]> {
  const data = useDb()
  const views = useMemo(
    () =>
      data.checkins
        .filter(isToday)
        .sort(newestFirst)
        .map((checkin) => ({
          checkin,
          member: data.members.find((m) => m.member_id === checkin.member_id) ?? null,
          scannerName:
            data.scanners.find((s) => s.scanner_id === checkin.scanner_id)?.scanner_name ?? null,
        })),
    [data],
  )
  return { data: views, isLoading: false }
}

export interface Summary extends CheckinSummary {
  activeMembers: number // can enter today, including those expiring soon
  expiring: number
}

export function useCheckinSummary(): Query<Summary> {
  const data = useDb()
  const summary = useMemo(() => {
    const records = recordsOf(data)
    return {
      ...summarizeCheckins(data.checkins.filter(isToday)),
      activeMembers: records.filter((r) => canEnter(r.status)).length,
      expiring: records.filter((r) => r.status === 'expiring').length,
    }
  }, [data])
  return { data: summary, isLoading: false }
}

// Records a check-in made by staff. Returns null (and saves nothing) if the
// member may not enter today.
export function addManualCheckin(memberId: string): Checkin | null {
  const access = memberAccess(db.memberships.filter((m) => m.member_id === memberId))
  if (!canEnter(access)) return null

  const now = new Date().toISOString()
  const checkin: Checkin = {
    checkin_id: newId(),
    gym_id: db.gym.gym_id,
    member_id: memberId,
    scanner_id: null,
    card_uid: null,
    result: 'allowed',
    source: 'manual',
    scanned_at: now,
    synced_at: now,
  }
  update({ checkins: [checkin, ...db.checkins] })
  return checkin
}

// ---------- Members ----------

// All members of this gym except archived ones.
export function useMembers(): Query<MemberRecord[]> {
  const data = useDb()
  const records = useMemo(() => recordsOf(data), [data])
  return { data: records, isLoading: false }
}

export interface MemberDetail extends MemberRecord {
  memberships: (Membership & { planName: string })[] // newest first
  payments: (Payment & { planName: string })[] // newest first
  checkins: Checkin[] // newest first
}

// data is null when no member has this id.
export function useMember(id: string | undefined): Query<MemberDetail | null> {
  const data = useDb()
  const detail = useMemo(() => {
    const record = recordsOf(data).find((r) => r.member.member_id === id)
    if (!record) return null
    const own = data.memberships
      .filter((m) => m.member_id === id)
      .sort((a, b) => b.start_date.localeCompare(a.start_date))
      .map((m) => ({ ...m, planName: planName(data, m.plan_id) }))
    return {
      ...record,
      memberships: own,
      payments: data.payments
        .flatMap((p) => {
          const membership = own.find((m) => m.membership_id === p.membership_id)
          return membership ? [{ ...p, planName: membership.planName }] : []
        })
        .sort((a, b) => b.paid_at.localeCompare(a.paid_at)),
      checkins: data.checkins.filter((c) => c.member_id === id).sort(newestFirst),
    }
  }, [data, id])
  return { data: detail, isLoading: false }
}

// ---------- Plans, memberships and payments ----------

export function usePlans(): Query<Plan[]> {
  return { data: useDb().plans, isLoading: false }
}

// A new membership and its payment, not saved yet.
function sale(
  memberId: string,
  plan: Plan,
  start: string,
  payment: PaymentInput,
  amountCentavos: number,
) {
  const membership: Membership = {
    membership_id: newId(),
    gym_id: db.gym.gym_id,
    member_id: memberId,
    plan_id: plan.plan_id,
    start_date: start,
    end_date: endDateFor(start, plan.duration_days),
    status: 'active',
    created_by: currentUserId(),
  }
  const paid: Payment = {
    payment_id: newId(),
    membership_id: membership.membership_id,
    amount_centavos: amountCentavos,
    method: payment.method,
    reference_no: savedReference(payment),
    paid_at: new Date().toISOString(),
    recorded_by: currentUserId(),
  }
  return { membership, paid }
}

export interface NewMember {
  fullName: string
  phone: string
  email: string
  photoUrl: string
  planId: string
  payment: PaymentInput
}

// Saves the member (with consent), their first membership starting today, and
// the payment. Returns the new member's id.
export function registerMember(input: NewMember): string {
  const plan = db.plans.find((p) => p.plan_id === input.planId)!
  const now = new Date().toISOString()
  const member: Member = {
    member_id: newId(),
    gym_id: db.gym.gym_id,
    full_name: input.fullName.trim(),
    phone: input.phone,
    email: input.email.trim() || null,
    photo_url: input.photoUrl,
    consent_at: now,
    status: 'active',
    created_at: now,
  }
  const { membership, paid } = sale(
    member.member_id,
    plan,
    todayInManila(),
    input.payment,
    plan.price_centavos,
  )
  update({
    members: [...db.members, member],
    memberships: [...db.memberships, membership],
    payments: [...db.payments, paid],
  })
  return member.member_id
}

// ---------- Development only ----------
// Call these only behind `import.meta.env.DEV`, so production builds drop them.

export function simulateTap() {
  update({ checkins: [randomCheckin(db), ...db.checkins] })
}

export function clearCheckins() {
  update({ checkins: [] })
}
