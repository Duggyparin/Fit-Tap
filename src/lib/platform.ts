// Rules for the platform admin: subscriptions, onboarding and alerts.

import type { DateString, Gym } from '../types'
import { daysLeft, todayInManila } from './format'

export const GRACE_DAYS = 7 // days after the due date before suspension is offered
export const SCANNER_ALERT_MINUTES = 30
export const QUIET_DAYS = 3 // "no check-ins for 3+ days"
export const ONBOARDING_STUCK_DAYS = 7 // still on trial and not finished

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

// One month later, kept inside the month: Jan 31 -> Feb 28.
export function addMonth(date: DateString): DateString {
  const [y, m, d] = date.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  return new Date(Date.UTC(y, m, Math.min(d, lastDay))).toISOString().slice(0, 10)
}

export interface OnboardingStep {
  label: string
  done: boolean
}

export function onboardingSteps(done: {
  ownerInvited: boolean
  plans: boolean
  scannerOnline: boolean
  cardLinked: boolean
  checkin: boolean
}): OnboardingStep[] {
  return [
    { label: 'Owner invited', done: done.ownerInvited },
    { label: 'Plans set up', done: done.plans },
    { label: 'Scanner online', done: done.scannerOnline },
    { label: 'First card linked', done: done.cardLinked },
    { label: 'First check-in', done: done.checkin },
  ]
}
