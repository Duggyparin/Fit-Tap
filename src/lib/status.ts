// One place that decides the wording, icon and color of every status, so the
// phone and desktop layouts always say the same thing.

import {
  Ban,
  CircleCheck,
  CircleQuestionMark,
  CircleSlash,
  CircleX,
  Clock,
  CreditCard,
  Snowflake,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import type { CheckinResult, CheckinSource } from '../types'
import type { MembershipState } from './membership'

export type StatusTone = 'success' | 'danger' | 'warning' | 'muted'

export interface StatusLook {
  tone: StatusTone
  icon: LucideIcon
  label: string
}

export const MEMBERSHIP_STATUS: Record<MembershipState, StatusLook> = {
  active: { tone: 'success', icon: CircleCheck, label: 'Active' },
  expiring: { tone: 'warning', icon: Clock, label: 'Expiring' },
  expired: { tone: 'danger', icon: CircleX, label: 'Expired' },
  frozen: { tone: 'muted', icon: Snowflake, label: 'Frozen' },
  cancelled: { tone: 'muted', icon: CircleSlash, label: 'Cancelled' },
}

// A check-in result: anything denied by the membership or card is red, like the
// scanner's red light. An unknown card is neutral because staff may link it.
export const CHECKIN_STATUS: Record<CheckinResult, StatusLook> = {
  allowed: { tone: 'success', icon: CircleCheck, label: 'Allowed' },
  expired: { tone: 'danger', icon: CircleX, label: 'Expired' },
  frozen: { tone: 'danger', icon: Snowflake, label: 'Frozen' },
  disabled: { tone: 'danger', icon: Ban, label: 'Card disabled' },
  unknown: { tone: 'muted', icon: CircleQuestionMark, label: 'Unknown card' },
}

export const NO_CARD_STATUS: StatusLook = { tone: 'muted', icon: CreditCard, label: 'No card' }

// "23 days left", "1 day left", "Last day today", "Expired 6 days ago"
export function daysLeftText(days: number): string {
  if (days === 0) return 'Last day today'
  const count = `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}`
  return days > 0 ? `${count} left` : `Expired ${count} ago`
}

// The badge for "how long does this member have left?"
export function daysLeftLook(status: MembershipState, days: number | null): StatusLook {
  // Frozen and cancelled memberships are not counting down.
  if (status === 'frozen' || status === 'cancelled') return MEMBERSHIP_STATUS[status]
  if (days === null) return { ...MEMBERSHIP_STATUS.expired, label: 'No membership' }
  return { ...MEMBERSHIP_STATUS[status], label: daysLeftText(days) }
}

export function scannerLook(online: boolean): StatusLook {
  return online
    ? { tone: 'success', icon: Wifi, label: 'Online' }
    : { tone: 'danger', icon: WifiOff, label: 'Offline' }
}

// "offline" taps (a later firmware stage) also come from a scanner.
export const SOURCE_LABEL: Record<CheckinSource, string> = {
  online: 'Scanner',
  offline: 'Scanner',
  manual: 'Manual',
}
