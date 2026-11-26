// One place that decides the wording, icon and color of every status, so the
// phone and desktop layouts always say the same thing.

import {
  Ban,
  CircleCheck,
  CircleQuestionMark,
  CircleSlash,
  CircleX,
  Clock,
  Snowflake,
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

// "offline" taps (a later firmware stage) also come from a scanner.
export const SOURCE_LABEL: Record<CheckinSource, string> = {
  online: 'Scanner',
  offline: 'Scanner',
  manual: 'Manual',
}
