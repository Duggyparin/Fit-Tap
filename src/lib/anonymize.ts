// Removes a member's personal details but keeps payments, memberships and
// check-ins, so totals stay correct.

import type { LinkRequest, Member, NfcCard, Timestamp } from '../types'

// A number that identifies the record without identifying the person.
export function memberNumber(memberId: string): number {
  return Number(memberId.slice(-12))
}

export function anonymizeMembers(
  data: { members: Member[]; cards: NfcCard[]; linkRequests: LinkRequest[] },
  ids: Set<string>,
  at: Timestamp = new Date().toISOString(),
) {
  return {
    members: data.members.map((m) =>
      ids.has(m.member_id)
        ? {
            ...m,
            full_name: `Former member #${memberNumber(m.member_id)}`,
            phone: '',
            email: null,
            photo_url: null,
            status: 'archived' as const,
            anonymized_at: at,
          }
        : m,
    ),
    // Their cards must stop opening the door.
    cards: data.cards.map((c) =>
      c.member_id && ids.has(c.member_id) && c.status === 'active'
        ? { ...c, status: 'disabled' as const }
        : c,
    ),
    linkRequests: data.linkRequests.map((r) =>
      ids.has(r.member_id) && r.status === 'pending' ? { ...r, status: 'cancelled' as const } : r,
    ),
  }
}
