// The in-memory "database" behind data.ts and adminData.ts. Screens never
// import this file. It resets when the page reloads.

import { useSyncExternalStore } from 'react'
import * as mock from '../mock'
import type { GymAuditEntry } from '../types'
import { mockId } from '../mock/helpers'
import { anonymizeMembers } from './anonymize'
import { WALK_IN_DEFAULT_CENTAVOS } from './constants'
import { retentionDue, type PrivacyContact } from './privacy'

export type QrMethod = 'gcash' | 'maya'

export interface GymSettings {
  walkInCentavos: number // default price on the Walk-in form
  qrCodes: Record<QrMethod, string | null> // the owner's payment QR pictures
  privacyContact: PrivacyContact | null // null = use the owner's name and email
}

export const DEFAULT_SETTINGS: GymSettings = {
  walkInCentavos: WALK_IN_DEFAULT_CENTAVOS,
  qrCodes: { gcash: null, maya: null },
  privacyContact: null,
}

// Development only: remember which role you are testing across reloads.
const ROLE_KEY = 'fittap-dev-user'

function startingUser(): string {
  if (!import.meta.env.DEV) return mock.OWNER_ID
  try {
    return sessionStorage.getItem(ROLE_KEY) ?? mock.OWNER_ID
  } catch {
    return mock.OWNER_ID
  }
}

const { platform } = mock

const initialDb = {
  currentUserId: startingUser(),
  viewGymId: null as string | null, // set while the admin uses "View as gym"
  gyms: [mock.gym, ...platform.gyms],
  settingsByGym: {} as Record<string, GymSettings>,
  appUsers: [...mock.appUsers, ...platform.users],
  members: [...mock.members, ...platform.members],
  memberships: [...mock.memberships, ...platform.memberships],
  payments: [...mock.payments, ...platform.payments],
  cards: mock.nfcCards,
  checkins: [...mock.checkins, ...mock.pastCheckins, ...platform.checkins],
  linkRequests: mock.linkRequests,
  walkIns: [...mock.walkIns, ...mock.pastWalkIns],
  plans: [...mock.plans, ...platform.plans],
  scanners: [...mock.scanners, ...platform.scanners],
  cardBatches: [...mock.cardBatches, ...platform.cardBatches],
  gymPayments: platform.gymPayments,
  auditLog: platform.auditLog,
  gymAuditLog: [] as GymAuditEntry[],
  // Mock only: the real hashes live on the server and never reach the browser.
  scannerTokenHashes: {} as Record<string, string>,
}

export type Db = typeof initialDb

// Removes the personal details of members whose retention period has passed.
// Mock only: for real this must be a scheduled job on the server.
function applyRetention(data: Db): Db {
  const due = data.members.filter((m) => retentionDue(m, data.memberships))
  if (due.length === 0) return data
  const now = new Date().toISOString()
  const changed = anonymizeMembers(data, new Set(due.map((m) => m.member_id)), now)
  return {
    ...data,
    ...changed,
    gymAuditLog: [
      ...due.map((m, i) => ({
        gym_audit_id: mockId(950_000 + i),
        gym_id: m.gym_id,
        actor_user_id: null,
        action: 'member_anonymized' as const,
        detail: `Member #${Number(m.member_id.slice(-12))}: 1 year after the membership ended`,
        created_at: now,
      })),
      ...data.gymAuditLog,
    ],
  }
}

export let db: Db = applyRetention(initialDb)
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function update(changes: Partial<Db>) {
  db = { ...db, ...changes }
  listeners.forEach((listener) => listener())
}

export function useAll(): Db {
  return useSyncExternalStore(subscribe, () => db)
}

let idCount = 800_000 // keeps new IDs apart from the fixed mock IDs
export function newId() {
  idCount += 1
  return mockId(idCount)
}

export function currentUserId() {
  return db.currentUserId
}

// The gym whose screens are open.
export function activeGymId(data: Db): string {
  const user = data.appUsers.find((u) => u.user_id === data.currentUserId)
  return data.viewGymId ?? user?.gym_id ?? mock.GYM_ID
}

export function rememberUser(userId: string) {
  try {
    sessionStorage.setItem(ROLE_KEY, userId)
  } catch {
    // Private windows may block storage; the switch still works until reload.
  }
}
