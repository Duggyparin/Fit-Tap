// Rules for showing check-ins: the filter chips and the denial wording.

import type { Checkin, CheckinResult } from '../types'

export type CheckinFilter = 'all' | 'allowed' | 'denied' | 'unknown'

// "Denied" means a known card or member was refused. Unknown cards have their
// own filter.
export function matchesFilter(result: CheckinResult, filter: CheckinFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'denied') return result !== 'allowed' && result !== 'unknown'
  return result === filter
}

// The extra line under a refused tap. null = nothing to explain.
export const DENIAL_REASON: Record<CheckinResult, string | null> = {
  allowed: null,
  expired: 'Membership expired',
  frozen: 'Membership frozen',
  disabled: 'Card disabled',
  unknown: 'Card not linked to a member',
}

export interface CheckinSummary {
  membersIn: number // unique members allowed in
  allowedTaps: number
  denied: number
  unknown: number
}

export function summarizeCheckins(checkins: Checkin[]): CheckinSummary {
  const allowed = checkins.filter((c) => c.result === 'allowed')
  return {
    membersIn: new Set(allowed.map((c) => c.member_id)).size,
    allowedTaps: allowed.length,
    denied: checkins.filter((c) => matchesFilter(c.result, 'denied')).length,
    unknown: checkins.filter((c) => c.result === 'unknown').length,
  }
}

// e.g. "41 taps · 3 denied · 1 unknown". Parts that add nothing are left out.
export function summaryHint(s: CheckinSummary): string {
  const parts: string[] = []
  if (s.allowedTaps !== s.membersIn) parts.push(`${s.allowedTaps} taps`)
  if (s.denied > 0) parts.push(`${s.denied} denied`)
  if (s.unknown > 0) parts.push(`${s.unknown} unknown`)
  return parts.join(' · ')
}
