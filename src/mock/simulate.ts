// Development only: invents a believable tap, like the scanner would send.
// The result always matches the member's real state in the mock data.

import { memberAccess } from '../lib/membership'
import type { Checkin, CheckinResult, CheckinSource } from '../types'
import { GYM_ID } from './gym'
import { mockId } from './helpers'
import { members } from './members'
import { memberships } from './memberships'
import { nfcCards } from './nfcCards'
import { scanners } from './scanners'

let counter = 900_000 // keeps simulated IDs apart from the fixed mock IDs

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function randomCheckin(): Checkin {
  counter += 1
  const now = new Date().toISOString()
  const scanner = pick(scanners.filter((s) => s.status === 'active'))

  function build(
    member_id: string | null,
    card_uid: string | null,
    result: CheckinResult,
    source: CheckinSource,
  ): Checkin {
    return {
      checkin_id: mockId(counter),
      gym_id: GYM_ID,
      member_id,
      scanner_id: source === 'manual' ? null : scanner.scanner_id,
      card_uid,
      result,
      source,
      scanned_at: now,
      synced_at: now,
    }
  }

  const unknownUid = `04FF${counter.toString(16).toUpperCase().padStart(10, '0')}`
  if (Math.random() < 0.15) return build(null, unknownUid, 'unknown', 'online')

  const member = pick(members)
  const card = nfcCards.find((c) => c.member_id === member.member_id)
  const access = memberAccess(memberships.filter((m) => m.member_id === member.member_id))
  const canEnter = access === 'active' || access === 'expiring'

  // Staff check in some allowed members by hand (forgot or has no card).
  if (canEnter && (!card || Math.random() < 0.2)) {
    return build(member.member_id, null, 'allowed', 'manual')
  }
  if (!card) return build(null, unknownUid, 'unknown', 'online')
  if (card.status !== 'active') return build(member.member_id, card.card_uid, 'disabled', 'online')

  const result: CheckinResult = canEnter ? 'allowed' : access === 'frozen' ? 'frozen' : 'expired'
  return build(member.member_id, card.card_uid, result, 'online')
}
