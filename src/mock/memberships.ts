import { endDateFor } from '../lib/membership'
import type { Membership, MembershipStatus } from '../types'
import { OWNER_ID } from './appUsers'
import { GYM_ID } from './gym'
import { daysFromToday, mockId } from './helpers'
import { M } from './members'
import { PLAN, plans } from './plans'

// Builds a membership from the day it ends (relative to today) and the plan's
// length. end_date is the last day the member may enter (inclusive), so the
// start is (duration - 1) days earlier, and endDateFor() gives back the end.
function membership(
  n: number,
  member_id: string,
  plan_id: string,
  endInDays: number,
  status: MembershipStatus = 'active',
): Membership {
  const duration = plans.find((p) => p.plan_id === plan_id)!.duration_days
  const start_date = daysFromToday(endInDays - (duration - 1))
  return {
    membership_id: mockId(n),
    gym_id: GYM_ID,
    member_id,
    plan_id,
    start_date,
    end_date: endDateFor(start_date, duration),
    status,
    created_by: OWNER_ID,
  }
}

export const memberships: Membership[] = [
  membership(300, M.juan, PLAN.monthly, -7), // Juan's previous month (history)
  membership(301, M.juan, PLAN.monthly, 23),
  membership(302, M.maria, PLAN.quarterly, 4),
  membership(303, M.paolo, PLAN.monthly, -6),
  membership(304, M.angela, PLAN.studentMonthly, 12),
  membership(305, M.miguel, PLAN.annual, 250),
  membership(306, M.kristine, PLAN.monthly, 0),
  membership(307, M.carlo, PLAN.weekly, 2),
  membership(308, M.nina, PLAN.monthly, 18, 'frozen'),
  membership(309, M.jose, PLAN.quarterly, -30),
  membership(310, M.liza, PLAN.monthly, 27),
  membership(311, M.mark, PLAN.monthly, 7),
  membership(312, M.rhea, PLAN.monthly, 15),
  membership(313, M.jerome, PLAN.monthly, 29), // starts today: today..today+29
  membership(314, M.andrea, PLAN.annual, 100, 'cancelled'),
  membership(315, M.bea, PLAN.monthly, 9),
]
