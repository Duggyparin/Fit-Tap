// Past check-ins and walk-ins for the last 30 days, so reports and charts have
// something to show. Pseudo-random but the same on every load.

import type { Checkin, WalkIn } from '../types'
import { OWNER_ID, STAFF_ID } from './appUsers'
import { GYM_ID } from './gym'
import { daysFromToday, mockId, pesos } from './helpers'
import { memberships } from './memberships'
import { nfcCards } from './nfcCards'
import { FRONT_DOOR_ID } from './scanners'

const DAYS = 30
// Busier before work and after work.
const HOURS = [6, 6, 7, 7, 8, 9, 12, 15, 16, 17, 17, 17, 18, 18, 18, 19, 19, 20]

let seed = 42
function random(): number {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)]
}

function timeOn(daysAgo: number): string {
  const hour = String(pick(HOURS)).padStart(2, '0')
  const minute = String(Math.floor(random() * 60)).padStart(2, '0')
  return new Date(`${daysFromToday(-daysAgo)}T${hour}:${minute}:00+08:00`).toISOString()
}

export const pastCheckins: Checkin[] = []
export const pastWalkIns: WalkIn[] = []

for (let daysAgo = 1; daysAgo <= DAYS; daysAgo++) {
  const day = daysFromToday(-daysAgo)
  const covered = memberships.filter(
    (m) => m.status === 'active' && m.start_date <= day && m.end_date >= day,
  )
  for (const m of covered) {
    if (random() > 0.55) continue
    const card = nfcCards.find((c) => c.member_id === m.member_id && c.status === 'active')
    const manual = !card || random() < 0.1
    const at = timeOn(daysAgo)
    pastCheckins.push({
      checkin_id: mockId(10_000 + pastCheckins.length),
      gym_id: GYM_ID,
      member_id: m.member_id,
      scanner_id: manual ? null : FRONT_DOOR_ID,
      card_uid: manual ? null : card.card_uid,
      result: 'allowed',
      source: manual ? 'manual' : 'online',
      scanned_at: at,
      synced_at: at,
    })
  }
  const guests = Math.floor(random() * 4)
  for (let i = 0; i < guests; i++) {
    const method = pick(['cash', 'cash', 'gcash', 'maya'] as const)
    pastWalkIns.push({
      walkin_id: mockId(20_000 + pastWalkIns.length),
      gym_id: GYM_ID,
      guest_name: null,
      amount_centavos: pesos(100),
      method,
      reference_no: method === 'cash' ? null : `REF${700000 + pastWalkIns.length}`,
      visited_at: timeOn(daysAgo),
      recorded_by: random() < 0.5 ? OWNER_ID : STAFF_ID,
    })
  }
}
