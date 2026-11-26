// The only place the screens get their data from. Today it reads and writes an
// in-memory copy of the mock data; later these hooks and actions will talk to
// Supabase and keep the same shape, so the pages do not need to change.

import { useMemo } from 'react'
import * as mock from '../mock'
import { randomCheckin } from '../mock/simulate'
import type {
  AppUser,
  CardBatch,
  Checkin,
  Gym,
  LinkRequest,
  LinkResult,
  Member,
  Membership,
  NfcCard,
  Payment,
  PaymentMethod,
  Plan,
  Scanner,
  WalkIn,
} from '../types'
import { summarizeCheckins, type CheckinSummary } from './checkins'
import { LINK_SECONDS, RECENT_TAPS_HOURS } from './constants'
import { todayInManila } from './format'
import { buildMemberRecord, canEnter, type MemberRecord } from './members'
import { endDateFor, latestRunning, memberAccess, renewalStartFor } from './membership'
import { savedReference, type PaymentInput } from './payments'
import { inRange, type Range } from './reports'
import { isScannerOnline } from './scanners'
import {
  activeGymId,
  currentUserId,
  db,
  DEFAULT_SETTINGS,
  newId,
  update,
  useAll,
  type Db,
  type GymSettings,
} from './store'
import { useNow } from './useNow'

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

// ---------- The gym whose screens are open ----------

// Gym screens only ever see one gym: the signed-in user's, or the one the
// platform admin is viewing. (Row Level Security must enforce this for real.)
// cards stay unfiltered so "belongs to another gym" can be detected.
function scoped(all: Db) {
  const id = activeGymId(all)
  const mine = <T extends { gym_id: string | null }>(rows: T[]) =>
    rows.filter((r) => r.gym_id === id)
  const memberships = mine(all.memberships)
  const sold = new Set(memberships.map((m) => m.membership_id))
  return {
    ...all,
    gym: all.gyms.find((g) => g.gym_id === id)!,
    settings: all.settingsByGym[id] ?? DEFAULT_SETTINGS,
    appUsers: mine(all.appUsers),
    members: mine(all.members),
    memberships,
    payments: all.payments.filter((p) => sold.has(p.membership_id)),
    checkins: mine(all.checkins),
    linkRequests: mine(all.linkRequests),
    walkIns: mine(all.walkIns),
    plans: mine(all.plans),
    scanners: mine(all.scanners),
    cardBatches: mine(all.cardBatches),
  }
}

type GymView = ReturnType<typeof scoped>
const views = new WeakMap<Db, GymView>()

function useDb(): GymView {
  const all = useAll()
  let view = views.get(all)
  if (!view) views.set(all, (view = scoped(all)))
  return view
}

// ---------- Helpers ----------

function isToday(c: Checkin): boolean {
  return todayInManila(new Date(c.scanned_at)) === todayInManila()
}

function newestFirst(a: Checkin, b: Checkin): number {
  return b.scanned_at.localeCompare(a.scanned_at)
}

function recordsOf(data: GymView): MemberRecord[] {
  return data.members
    .filter((m) => m.gym_id === data.gym.gym_id && m.status === 'active')
    .map((m) => buildMemberRecord(m, data.memberships, data.plans, data.cards))
}

function planName(data: GymView, planId: string): string {
  return data.plans.find((p) => p.plan_id === planId)?.plan_name ?? 'Unknown plan'
}

// ---------- Gym and user ----------

export function useGym(): Query<Gym> {
  return { data: useDb().gym, isLoading: false }
}

export function useCurrentUser(): Query<AppUser> {
  const all = useAll()
  return { data: all.appUsers.find((u) => u.user_id === all.currentUserId)!, isLoading: false }
}

// Owner-only parts. While the admin views a gym, show what its owner would see.
export function useIsOwner(): boolean {
  const all = useAll()
  const role = all.appUsers.find((u) => u.user_id === all.currentUserId)?.role
  return role === 'owner' || all.viewGymId !== null
}

// The gym the platform admin is viewing read-only, or null.
export function useViewingGym(): Gym | null {
  const all = useAll()
  return all.gyms.find((g) => g.gym_id === all.viewGymId) ?? null
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
    gym_id: activeGymId(db),
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
    gym_id: activeGymId(db),
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
    gym_id: activeGymId(db),
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

// ---------- Scanners ----------

export interface ScannerView {
  scanner: Scanner
  online: boolean
}

// This gym's scanners, the default one first. Rechecks "online" every 10 s.
export function useScanners(): Query<ScannerView[]> {
  const data = useDb()
  const now = useNow(10_000)
  const views = data.scanners
    .filter((s) => s.gym_id === data.gym.gym_id)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default))
    .map((scanner) => ({ scanner, online: isScannerOnline(scanner, now) }))
  return { data: views, isLoading: false }
}

// MOCK ONLY: pretend the scanners that are online keep reporting in. The real
// firmware only reports when a card is tapped (see docs/schema-todo.md).
const beating = mock.scanners.filter((s) => isScannerOnline(s)).map((s) => s.scanner_id)
window.setInterval(() => {
  const now = new Date().toISOString()
  update({
    scanners: db.scanners.map((s) =>
      beating.includes(s.scanner_id) ? { ...s, last_seen_at: now } : s,
    ),
  })
}, 30_000)

// ---------- Link mode ----------

// With Supabase this hook will poll the row every 2 s (Realtime later).
export function useLinkRequest(requestId: string | null): Query<LinkRequest | null> {
  const requests = useDb().linkRequests
  const data = requests.find((r) => r.request_id === requestId) ?? null
  return { data, isLoading: false }
}

function setRequest(requestId: string, changes: Partial<LinkRequest>) {
  update({
    linkRequests: db.linkRequests.map((r) =>
      r.request_id === requestId ? { ...r, ...changes } : r,
    ),
  })
}

function isPending(r: LinkRequest): boolean {
  return r.status === 'pending' && Date.parse(r.expires_at) > Date.now()
}

// Starts waiting for a card. Only one pending request per scanner: an earlier
// one for the same member is cancelled; another member's means "busy" (null).
export function startLinkRequest(memberId: string, scannerId: string): LinkRequest | null {
  const pending = db.linkRequests.filter((r) => r.scanner_id === scannerId && isPending(r))
  if (pending.some((r) => r.member_id !== memberId)) return null
  pending.forEach((r) => setRequest(r.request_id, { status: 'cancelled' }))

  const request: LinkRequest = {
    request_id: newId(),
    gym_id: activeGymId(db),
    scanner_id: scannerId,
    member_id: memberId,
    requested_by: currentUserId(),
    status: 'pending',
    card_uid: null,
    result: null,
    expires_at: new Date(Date.now() + LINK_SECONDS * 1000).toISOString(),
  }
  update({ linkRequests: [...db.linkRequests, request] })
  return request
}

// Ends a request that is still pending (no effect otherwise).
export function endLinkRequest(requestId: string, status: 'cancelled' | 'expired') {
  const request = db.linkRequests.find((r) => r.request_id === requestId)
  if (request?.status === 'pending') setRequest(requestId, { status })
}

// ---------- Cards ----------

// Used by "Replace card": the old card stops working before a new one is linked.
export function markCardsLost(memberId: string) {
  update({
    cards: db.cards.map((c) =>
      c.member_id === memberId && c.status === 'active' ? { ...c, status: 'lost' } : c,
    ),
  })
}

// Attaches a card to a member (an existing card row, or a new plain card).
function assignCard(memberId: string, uid: string) {
  const changes = {
    member_id: memberId,
    status: 'active' as const,
    assigned_at: new Date().toISOString(),
  }
  const existing = db.cards.find((c) => c.card_uid === uid)
  update({
    cards: existing
      ? db.cards.map((c) => (c.card_id === existing.card_id ? { ...c, ...changes } : c))
      : [
          ...db.cards,
          {
            card_id: newId(),
            gym_id: activeGymId(db),
            batch_id: null,
            card_uid: uid,
            card_number: null,
            ...changes,
          },
        ],
  })
}

// Why this card cannot go to this member, or null if it can.
function cardProblem(card: NfcCard | undefined, memberId: string): string | null {
  if (!card) return null
  if (card.gym_id !== activeGymId(db)) return 'This card belongs to another gym.'
  if (card.status === 'lost') return 'This card was marked lost and cannot be used.'
  if (card.status === 'disabled') return 'This card is disabled and cannot be used.'
  if (card.member_id === memberId) return 'This card is already linked to this member.'
  if (card.member_id) {
    const owner = db.members.find((m) => m.member_id === card.member_id)
    return `This card is already in use by ${owner?.full_name ?? 'another member'}.`
  }
  return null
}

// Both return an error message, or null when the card was linked.
export function linkCardByUid(memberId: string, uid: string): string | null {
  const problem = cardProblem(
    db.cards.find((c) => c.card_uid === uid),
    memberId,
  )
  if (!problem) assignCard(memberId, uid)
  return problem
}

export function linkCardByNumber(memberId: string, number: string): string | null {
  const wanted = number.trim().toUpperCase()
  const matches = db.cards.filter((c) => c.card_number?.toUpperCase() === wanted)
  // Numbers can repeat between gyms: prefer this gym's card.
  const card = matches.find((c) => c.gym_id === activeGymId(db)) ?? matches[0]
  if (!card) return `No card with the number ${wanted} was found.`
  return cardProblem(card, memberId) ?? linkCardByUid(memberId, card.card_uid)
}

export interface UnknownTap {
  uid: string
  tappedAt: string
  scannerName: string
}

// Unlinked cards tapped recently, newest first, one row per card.
export function useRecentUnknownTaps(): Query<UnknownTap[]> {
  const data = useDb()
  const now = useNow(30_000)
  const since = now - RECENT_TAPS_HOURS * 3_600_000
  const taps = new Map<string, UnknownTap>()
  for (const c of [...data.checkins].sort(newestFirst)) {
    if (c.result !== 'unknown' || !c.card_uid || taps.has(c.card_uid)) continue
    if (Date.parse(c.scanned_at) < since) continue
    const card = data.cards.find((x) => x.card_uid === c.card_uid)
    // Skip cards that have since been linked or blocked.
    if (card && (card.status !== 'stock' || card.gym_id !== data.gym.gym_id)) continue
    taps.set(c.card_uid, {
      uid: c.card_uid,
      tappedAt: c.scanned_at,
      scannerName:
        data.scanners.find((s) => s.scanner_id === c.scanner_id)?.scanner_name ?? 'Scanner',
    })
  }
  return { data: [...taps.values()], isLoading: false }
}

// Development only: pretends a card was tapped while the scanner waits to link.
export function simulateLinkTap(requestId: string, result: LinkResult) {
  const request = db.linkRequests.find((r) => r.request_id === requestId)
  if (!request || !isPending(request)) return
  if (result !== 'linked') {
    // Like index.ts, a refused card leaves the request pending.
    setRequest(requestId, { result })
    return
  }
  const stock = db.cards.find((c) => c.gym_id === activeGymId(db) && c.status === 'stock')
  const uid = stock?.card_uid ?? `04AA${newId().slice(-10)}`
  assignCard(request.member_id, uid)
  setRequest(requestId, { status: 'done', card_uid: uid, result })
}

// Saves a renewal and its payment. The start date follows the renewal rule.
export function renewMembership(
  memberId: string,
  planId: string,
  payment: PaymentInput,
  amountCentavos: number,
): Membership {
  const plan = db.plans.find((p) => p.plan_id === planId)!
  const today = todayInManila()
  const own = db.memberships.filter((m) => m.member_id === memberId)
  const start = renewalStartFor(latestRunning(own, today), today)
  const { membership, paid } = sale(memberId, plan, start, payment, amountCentavos)
  update({
    memberships: [...db.memberships, membership],
    payments: [...db.payments, paid],
  })
  return membership
}

// ---------- Gym settings ----------

export function useSettings(): Query<GymSettings> {
  return { data: useDb().settings, isLoading: false }
}

// ---------- Walk-ins ----------

export function useTodayWalkIns(): Query<{ walkIns: WalkIn[]; totalCentavos: number }> {
  const all = useDb().walkIns
  const data = useMemo(() => {
    const today = todayInManila()
    const walkIns = all
      .filter((w) => todayInManila(new Date(w.visited_at)) === today)
      .sort((a, b) => b.visited_at.localeCompare(a.visited_at))
    return { walkIns, totalCentavos: walkIns.reduce((sum, w) => sum + w.amount_centavos, 0) }
  }, [all])
  return { data, isLoading: false }
}

export function addWalkIn(input: {
  guestName: string
  amountCentavos: number
  payment: PaymentInput
}): WalkIn {
  const walkIn: WalkIn = {
    walkin_id: newId(),
    gym_id: activeGymId(db),
    guest_name: input.guestName.trim() || null,
    amount_centavos: input.amountCentavos,
    method: input.payment.method,
    reference_no: savedReference(input.payment),
    visited_at: new Date().toISOString(), // always filled in automatically
    recorded_by: currentUserId(),
  }
  update({ walkIns: [walkIn, ...db.walkIns] })
  return walkIn
}

// ---------- Reports ----------

export interface IncomeRow {
  kind: 'membership' | 'walkin'
  at: string
  name: string
  plan: string
  amountCentavos: number
  method: PaymentMethod
  reference: string | null
}

export interface Report {
  income: IncomeRow[] // oldest first
  totals: { memberships: number; walkIns: number; total: number; walkInCount: number }
  checkins: (Checkin & { memberName: string; scannerName: string })[] // oldest first
}

// Everything that happened at this gym between two Manila dates (inclusive).
export function useReport(range: Range): Query<Report> {
  const data = useDb()
  const { from, to } = range
  const report = useMemo(() => {
    const within = (at: string) => inRange(at, { from, to })
    const nameOf = (id: string | null) =>
      data.members.find((m) => m.member_id === id)?.full_name ?? 'Unknown card'

    const paid: IncomeRow[] = data.payments
      .filter((p) => within(p.paid_at))
      .map((p) => {
        const membership = data.memberships.find((m) => m.membership_id === p.membership_id)!
        return {
          kind: 'membership',
          at: p.paid_at,
          name: nameOf(membership.member_id),
          plan: planName(data, membership.plan_id),
          amountCentavos: p.amount_centavos,
          method: p.method,
          reference: p.reference_no,
        }
      })
    const visits: IncomeRow[] = data.walkIns
      .filter((w) => within(w.visited_at))
      .map((w) => ({
        kind: 'walkin',
        at: w.visited_at,
        name: w.guest_name ?? 'Walk-in guest',
        plan: '',
        amountCentavos: w.amount_centavos,
        method: w.method,
        reference: w.reference_no,
      }))
    const sum = (rows: IncomeRow[]) => rows.reduce((total, r) => total + r.amountCentavos, 0)

    return {
      income: [...paid, ...visits].sort((a, b) => a.at.localeCompare(b.at)),
      totals: {
        memberships: sum(paid),
        walkIns: sum(visits),
        total: sum(paid) + sum(visits),
        walkInCount: visits.length,
      },
      checkins: data.checkins
        .filter((c) => within(c.scanned_at))
        .sort((a, b) => a.scanned_at.localeCompare(b.scanned_at))
        .map((c) => ({
          ...c,
          memberName: nameOf(c.member_id),
          scannerName:
            data.scanners.find((s) => s.scanner_id === c.scanner_id)?.scanner_name ?? '',
        })),
    }
  }, [data, from, to])
  return { data: report, isLoading: false }
}

// ---------- Plans ----------

export interface PlanInput {
  name: string
  durationDays: number
  priceCentavos: number
}

// Adds a plan, or edits the one with planId. Existing memberships keep their
// dates and payments.
export function savePlan(input: PlanInput, planId?: string) {
  const fields = {
    plan_name: input.name.trim(),
    duration_days: input.durationDays,
    price_centavos: input.priceCentavos,
  }
  update({
    plans: planId
      ? db.plans.map((p) => (p.plan_id === planId ? { ...p, ...fields } : p))
      : [...db.plans, { plan_id: newId(), gym_id: activeGymId(db), is_active: true, ...fields }],
  })
}

// Plans are retired, never deleted, so old memberships keep their history.
export function setPlanActive(planId: string, active: boolean) {
  update({
    plans: db.plans.map((p) => (p.plan_id === planId ? { ...p, is_active: active } : p)),
  })
}

// ---------- Scanners, staff and settings ----------

export function setDefaultScanner(scannerId: string) {
  const gym = db.scanners.find((s) => s.scanner_id === scannerId)?.gym_id
  update({
    scanners: db.scanners.map((s) =>
      s.gym_id === gym ? { ...s, is_default: s.scanner_id === scannerId } : s,
    ),
  })
}

// This gym's owner and staff accounts (not the platform admin).
export function useStaff(): Query<AppUser[]> {
  const data = useDb()
  const users = data.appUsers.filter(
    (u) => u.gym_id === data.gym.gym_id && u.role !== 'platform_admin',
  )
  return { data: users, isLoading: false }
}

export function saveSettings(input: { gymName: string; walkInCentavos: number }) {
  const id = activeGymId(db)
  update({
    gyms: db.gyms.map((g) => (g.gym_id === id ? { ...g, gym_name: input.gymName.trim() } : g)),
    settingsByGym: { ...db.settingsByGym, [id]: { walkInCentavos: input.walkInCentavos } },
  })
}

// ---------- Card orders ----------

export interface BatchView {
  batch: CardBatch
  registered: number // card UIDs saved for this batch
  inStock: number
  linked: number
  blocked: number // lost or disabled
}

export function useCardBatches(): Query<BatchView[]> {
  const data = useDb()
  const views = useMemo(
    () =>
      data.cardBatches
        .filter((b) => b.gym_id === data.gym.gym_id)
        .sort((a, b) => b.ordered_at.localeCompare(a.ordered_at))
        .map((batch) => {
          const cards = data.cards.filter((c) => c.batch_id === batch.batch_id)
          const count = (...status: string[]) =>
            cards.filter((c) => status.includes(c.status)).length
          return {
            batch,
            registered: cards.length,
            inStock: count('stock'),
            linked: count('active'),
            blocked: count('lost', 'disabled'),
          }
        }),
    [data],
  )
  return { data: views, isLoading: false }
}

// ---------- Development only ----------
// Call these only behind `import.meta.env.DEV`, so production builds drop them.

export function simulateTap() {
  update({ checkins: [randomCheckin(scoped(db)), ...db.checkins] })
}

export function clearCheckins() {
  update({ checkins: [] })
}
