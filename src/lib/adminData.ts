// Data for the platform admin area (all gyms). Like data.ts, it uses the
// in-memory store now and Supabase later. Every admin action writes an audit
// entry. In the real system these actions must run on the server and be
// allowed only for platform_admin accounts.

import { useMemo } from 'react'
import { ADMIN_ID, OWNER_ID } from '../mock'
import type { AppUser, AuditAction, AuditEntry, Gym, GymPayment, Scanner } from '../types'
import type { Query } from './data'
import { formatAgo, formatDate, formatPeso, todayInManila } from './format'
import { buildMemberRecord, canEnter } from './members'
import { METHOD_LABEL, savedReference, type PaymentInput } from './payments'
import {
  addMonth,
  daysOverdue,
  ONBOARDING_STUCK_DAYS,
  onboardingSteps,
  QUIET_DAYS,
  SCANNER_ALERT_MINUTES,
  subscriptionState,
  type OnboardingStep,
  type SubscriptionState,
} from './platform'
import { dayOf } from './reports'
import { isScannerOnline } from './scanners'
import { currentUserId, db, newId, rememberUser, update, useAll, type Db } from './store'
import { useNow } from './useNow'

// ---------- Development only: switch between roles ----------

export function switchUser(role: 'owner' | 'platform_admin') {
  const userId = role === 'owner' ? OWNER_ID : ADMIN_ID
  rememberUser(userId)
  update({ currentUserId: userId, viewGymId: null })
}

// ---------- Gyms ----------

export interface GymSummary {
  gym: Gym
  owner: AppUser | null
  memberCount: number
  activeMembers: number
  checkinsToday: number // unique members allowed in today
  lastActivity: string | null // newest check-in
  subscription: SubscriptionState
  steps: OnboardingStep[]
  stuck: boolean // trial that has not finished onboarding
}

function summarize(data: Db, gym: Gym): GymSummary {
  const mine = <T extends { gym_id: string | null }>(rows: T[]) =>
    rows.filter((r) => r.gym_id === gym.gym_id)
  const owners = mine(data.appUsers).filter((u) => u.role === 'owner')
  const members = mine(data.members).filter((m) => m.status === 'active')
  const records = members.map((m) =>
    buildMemberRecord(m, data.memberships, data.plans, data.cards),
  )
  const checkins = mine(data.checkins)
  const today = todayInManila()
  const steps = onboardingSteps({
    ownerInvited: owners.length > 0,
    plans: mine(data.plans).some((p) => p.is_active),
    scannerOnline: mine(data.scanners).some((s) => isScannerOnline(s)),
    cardLinked: mine(data.cards).some((c) => c.member_id !== null),
    checkin: checkins.length > 0,
  })
  const age = (Date.now() - Date.parse(gym.created_at)) / 86_400_000
  return {
    gym,
    owner: owners[0] ?? null,
    memberCount: members.length,
    activeMembers: records.filter((r) => canEnter(r.status)).length,
    checkinsToday: new Set(
      checkins
        .filter((c) => c.result === 'allowed' && dayOf(c.scanned_at) === today)
        .map((c) => c.member_id),
    ).size,
    lastActivity: checkins.map((c) => c.scanned_at).sort().at(-1) ?? null,
    subscription: subscriptionState(gym),
    steps,
    stuck: gym.status === 'trial' && age >= ONBOARDING_STUCK_DAYS && steps.some((s) => !s.done),
  }
}

export function useAdminGyms(): Query<GymSummary[]> {
  const data = useAll()
  const gyms = useMemo(
    () =>
      data.gyms
        .map((gym) => summarize(data, gym))
        .sort((a, b) => a.gym.gym_name.localeCompare(b.gym.gym_name)),
    [data],
  )
  return { data: gyms, isLoading: false }
}

export interface GymDetail extends GymSummary {
  payments: GymPayment[] // newest first
  scanners: Scanner[]
}

export function useAdminGym(gymId: string | undefined): Query<GymDetail | null> {
  const data = useAll()
  const detail = useMemo(() => {
    const gym = data.gyms.find((g) => g.gym_id === gymId)
    if (!gym) return null
    return {
      ...summarize(data, gym),
      payments: data.gymPayments
        .filter((p) => p.gym_id === gymId)
        .sort((a, b) => b.paid_at.localeCompare(a.paid_at)),
      scanners: data.scanners.filter((s) => s.gym_id === gymId),
    }
  }, [data, gymId])
  return { data: detail, isLoading: false }
}

// ---------- Overview ----------

export interface Alert {
  id: string
  gymId: string
  kind: 'scanner' | 'quiet' | 'overdue' | 'onboarding'
  text: string
}

export interface Overview {
  byStatus: Record<Gym['status'], number>
  activeMembers: number
  checkinsToday: number
  scannersOffline: number
  overdueGyms: number
  alerts: Alert[]
}

export function useOverview(): Query<Overview> {
  const data = useAll()
  const now = useNow(30_000)
  const gyms = useAdminGyms().data
  const deployed = data.scanners.filter(
    (s) =>
      s.hardware_status === 'at_gym' &&
      s.status === 'active' &&
      data.gyms.some((g) => g.gym_id === s.gym_id && g.status !== 'suspended'),
  )

  const alerts: Alert[] = []
  for (const g of gyms) {
    const { gym_id: gymId, gym_name: name } = g.gym
    const suspended = g.gym.status === 'suspended'
    if (g.subscription === 'grace' || g.subscription === 'overdue') {
      const late = daysOverdue(g.gym)
      alerts.push({
        id: `due-${gymId}`,
        gymId,
        kind: 'overdue',
        text: `${name}: payment ${late} ${late === 1 ? 'day' : 'days'} overdue${g.subscription === 'grace' ? ' (grace period)' : ''}`,
      })
    }
    if (suspended) continue // a suspended gym is expected to be quiet
    if (g.stuck) {
      const left = g.steps.filter((s) => !s.done).length
      alerts.push({
        id: `onb-${gymId}`,
        gymId,
        kind: 'onboarding',
        text: `${name}: stuck in onboarding (${left} steps left)`,
      })
    }
    const since = g.lastActivity ?? g.gym.created_at
    if (now - Date.parse(since) >= QUIET_DAYS * 86_400_000) {
      alerts.push({
        id: `quiet-${gymId}`,
        gymId,
        kind: 'quiet',
        text: g.lastActivity
          ? `${name}: no check-ins since ${formatDate(g.lastActivity)}`
          : `${name}: no check-ins yet`,
      })
    }
    for (const s of deployed.filter((s) => s.gym_id === gymId)) {
      const seen = s.last_seen_at
      if (seen && now - Date.parse(seen) <= SCANNER_ALERT_MINUTES * 60_000) continue
      alerts.push({
        id: `scan-${s.scanner_id}`,
        gymId,
        kind: 'scanner',
        text: `${name}: scanner “${s.scanner_name}” ${seen ? `offline, last seen ${formatAgo(seen, now)}` : 'has never connected'}`,
      })
    }
  }

  const count = (status: Gym['status']) => gyms.filter((g) => g.gym.status === status).length
  return {
    data: {
      byStatus: { active: count('active'), trial: count('trial'), suspended: count('suspended') },
      activeMembers: gyms.reduce((sum, g) => sum + g.activeMembers, 0),
      checkinsToday: gyms.reduce((sum, g) => sum + g.checkinsToday, 0),
      scannersOffline: deployed.filter((s) => !isScannerOnline(s, now)).length,
      overdueGyms: gyms.filter(
        (g) =>
          g.subscription === 'grace' ||
          g.subscription === 'overdue' ||
          (g.subscription === 'suspended' && daysOverdue(g.gym) > 0),
      ).length,
      alerts,
    },
    isLoading: false,
  }
}

// ---------- Actions (each writes the audit log) ----------

function entry(action: AuditAction, gymId: string | null, detail: string): AuditEntry {
  return {
    audit_id: newId(),
    actor_user_id: currentUserId(),
    action,
    gym_id: gymId,
    detail,
    created_at: new Date().toISOString(),
  }
}

// Saves the changes together with their audit entries.
function commit(changes: Partial<Db>, ...entries: AuditEntry[]) {
  update({ ...changes, auditLog: [...entries.reverse(), ...db.auditLog] })
}

function newOwner(gymId: string, name: string, email: string): AppUser {
  return {
    user_id: newId(),
    gym_id: gymId,
    role: 'owner',
    display_name: name.trim(),
    email: email.trim().toLowerCase(),
    is_active: true,
    invited_at: new Date().toISOString(),
    accepted_at: null,
  }
}

export function emailTaken(email: string): boolean {
  const wanted = email.trim().toLowerCase()
  return db.appUsers.some((u) => u.email.toLowerCase() === wanted)
}

// Adds a gym on trial and invites its owner.
export function addGym(input: {
  name: string
  city: string
  feeCentavos: number
  ownerName: string
  ownerEmail: string
}): string {
  const gym: Gym = {
    gym_id: newId(),
    gym_name: input.name.trim(),
    slug: input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    logo_url: null,
    brand_color: null,
    timezone: 'Asia/Manila',
    status: 'trial',
    created_at: new Date().toISOString(),
    city: input.city.trim(),
    monthly_fee_centavos: input.feeCentavos,
    next_due_date: null,
  }
  const owner = newOwner(gym.gym_id, input.ownerName, input.ownerEmail)
  commit(
    { gyms: [...db.gyms, gym], appUsers: [...db.appUsers, owner] },
    entry('gym_added', gym.gym_id, `Added ${gym.gym_name}`),
    entry('owner_invited', gym.gym_id, `Invited ${owner.email}`),
  )
  return gym.gym_id
}

export function inviteOwner(gymId: string, name: string, email: string) {
  const owner = newOwner(gymId, name, email)
  commit(
    { appUsers: [...db.appUsers, owner] },
    entry('owner_invited', gymId, `Invited ${owner.email}`),
  )
}

export function resendInvite(userId: string) {
  const user = db.appUsers.find((u) => u.user_id === userId)
  if (!user || user.accepted_at) return
  const invited_at = new Date().toISOString()
  commit(
    { appUsers: db.appUsers.map((u) => (u.user_id === userId ? { ...u, invited_at } : u)) },
    entry('invite_resent', user.gym_id, `Resent invite to ${user.email}`),
  )
}

function changeGym(gymId: string, changes: Partial<Gym>) {
  return db.gyms.map((g) => (g.gym_id === gymId ? { ...g, ...changes } : g))
}

// A payment settles the current due date and moves it one month on. The first
// payment of a trial gym starts its subscription today. It does not lift a
// suspension: that is a separate, deliberate step.
export function recordGymPayment(gymId: string, amountCentavos: number, payment: PaymentInput) {
  const gym = db.gyms.find((g) => g.gym_id === gymId)
  if (!gym) return
  const paid: GymPayment = {
    gym_payment_id: newId(),
    gym_id: gymId,
    amount_centavos: amountCentavos,
    method: payment.method,
    reference_no: savedReference(payment),
    paid_at: new Date().toISOString(),
    covers_due_date: gym.next_due_date,
    recorded_by: currentUserId(),
  }
  commit(
    {
      gymPayments: [paid, ...db.gymPayments],
      gyms: changeGym(gymId, {
        next_due_date: addMonth(gym.next_due_date ?? todayInManila()),
        status: gym.status === 'trial' ? 'active' : gym.status,
      }),
    },
    entry(
      'payment_recorded',
      gymId,
      `${formatPeso(amountCentavos)} by ${METHOD_LABEL[payment.method]}`,
    ),
  )
}

export function suspendGym(gymId: string) {
  commit(
    { gyms: changeGym(gymId, { status: 'suspended' }) },
    entry('gym_suspended', gymId, 'Suspended'),
  )
}

export function reactivateGym(gymId: string) {
  const gym = db.gyms.find((g) => g.gym_id === gymId)
  if (!gym) return
  commit(
    { gyms: changeGym(gymId, { status: gym.next_due_date ? 'active' : 'trial' }) },
    entry('gym_reactivated', gymId, 'Reactivated'),
  )
}

// ---------- Owners ----------

export function useOwners(): Query<(AppUser & { gymName: string })[]> {
  const data = useAll()
  const owners = useMemo(
    () =>
      data.appUsers
        .filter((u) => u.role === 'owner')
        .map((u) => ({
          ...u,
          gymName: data.gyms.find((g) => g.gym_id === u.gym_id)?.gym_name ?? 'No gym',
        }))
        .sort((a, b) => a.gymName.localeCompare(b.gymName)),
    [data],
  )
  return { data: owners, isLoading: false }
}
