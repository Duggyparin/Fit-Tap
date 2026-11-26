import type { Plan } from '../types'
import { GYM_ID } from './gym'
import { mockId, pesos } from './helpers'

export const PLAN = {
  daily: mockId(31),
  weekly: mockId(32),
  monthly: mockId(33),
  quarterly: mockId(34),
  annual: mockId(35),
  studentMonthly: mockId(36),
}

function plan(plan_id: string, plan_name: string, duration_days: number, price: number): Plan {
  return { plan_id, gym_id: GYM_ID, plan_name, duration_days, price_centavos: pesos(price), is_active: true }
}

export const plans: Plan[] = [
  plan(PLAN.daily, 'Daily', 1, 100),
  plan(PLAN.weekly, 'Weekly', 7, 400),
  plan(PLAN.monthly, 'Monthly', 30, 1000),
  plan(PLAN.quarterly, 'Quarterly', 90, 2700),
  plan(PLAN.annual, 'Annual', 365, 9600),
  plan(PLAN.studentMonthly, 'Student monthly', 30, 800),
]
