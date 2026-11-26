// Rules for the platform admin: subscriptions, onboarding and alerts.

import type { AuditAction, DateString, Gym } from '../types'

// Placeholder prices: validate them with gym owners (roadmap #1).
export const DEFAULT_SETUP_FEE_CENTAVOS = 150_000
export const DEFAULT_ANNUAL_DISCOUNT = 10 // percent
import { daysLeft, todayInManila } from './format'

export const GRACE_DAYS = 7 // days after the due date before suspension is offered
export const SCANNER_ALERT_MINUTES = 30
export const QUIET_DAYS = 3 // "no check-ins for 3+ days"
export const ONBOARDING_STUCK_DAYS = 7 // still on trial and not finished

export const ACTION_LABEL: Record<AuditAction, string> = {
  gym_added: 'Gym added',
  owner_invited: 'Owner invited',
  invite_resent: 'Invite resent',
  payment_recorded: 'Payment recorded',
  gym_suspended: 'Gym suspended',
  gym_reactivated: 'Gym reactivated',
  view_as_started: 'Viewed as gym',
  scanner_registered: 'Scanner registered',
  token_rotated: 'Token rotated',
  scanner_revoked: 'Scanner revoked',
  default_scanner_set: 'Default scanner set',
  batch_registered: 'Batch registered',
  batch_status_changed: 'Order status changed',
  billing_changed: 'Billing changed',
}

export type SubscriptionState = 'trial' | 'paid' | 'grace' | 'overdue' | 'suspended'

export function daysOverdue(
  gym: Pick<Gym, 'next_due_date'>,
  today: DateString = todayInManila(),
): number {
  return gym.next_due_date ? Math.max(0, -daysLeft(gym.next_due_date, today)) : 0
}

export function subscriptionState(
  gym: Pick<Gym, 'status' | 'next_due_date'>,
  today: DateString = todayInManila(),
): SubscriptionState {
  if (gym.status === 'suspended') return 'suspended'
  if (!gym.next_due_date) return 'trial'
  const late = daysOverdue(gym, today)
  if (late === 0) return 'paid'
  return late <= GRACE_DAYS ? 'grace' : 'overdue'
}

// Months later, kept inside the month: Jan 31 + 1 -> Feb 28.
export function addMonth(date: DateString, months = 1): DateString {
  const [y, m, d] = date.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate()
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10)
}

type Pricing = Pick<Gym, 'billing_cycle' | 'monthly_fee_centavos' | 'annual_discount_percent'>

export function cycleMonths(gym: Pick<Gym, 'billing_cycle'>): number {
  return gym.billing_cycle === 'annual' ? 12 : 1
}

// What one billing cycle costs: the monthly fee, or 12 of them less the
// annual discount (rounded to whole centavos).
export function cyclePrice(gym: Pricing): number {
  if (gym.billing_cycle === 'monthly') return gym.monthly_fee_centavos
  return Math.round((gym.monthly_fee_centavos * 12 * (100 - gym.annual_discount_percent)) / 100)
}

export interface OnboardingStep {
  label: string
  done: boolean
}

export function onboardingSteps(done: {
  ownerInvited: boolean
  plans: boolean
  scannerSeen: boolean
  cardLinked: boolean
  checkin: boolean
}): OnboardingStep[] {
  return [
    { label: 'Owner invited', done: done.ownerInvited },
    { label: 'Plans set up', done: done.plans },
    { label: 'Scanner checked in at least once', done: done.scannerSeen },
    { label: 'First card linked', done: done.cardLinked },
    { label: 'First check-in', done: done.checkin },
  ]
}
