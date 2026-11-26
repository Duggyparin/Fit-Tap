// The in-memory "database" behind data.ts and adminData.ts. Screens never
// import this file. It resets when the page reloads.

import { useSyncExternalStore } from 'react'
import * as mock from '../mock'
import { mockId } from '../mock/helpers'
import { WALK_IN_DEFAULT_CENTAVOS } from './constants'

export interface GymSettings {
  walkInCentavos: number // default price on the Walk-in form
}

export const DEFAULT_SETTINGS: GymSettings = { walkInCentavos: WALK_IN_DEFAULT_CENTAVOS }

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
  // Mock only: the real hashes live on the server and never reach the browser.
  scannerTokenHashes: {} as Record<string, string>,
}

export type Db = typeof initialDb

export let db: Db = initialDb
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
