import type { Gym } from '../types'
import { daysFromToday, mockId } from './helpers'

export const GYM_ID = mockId(1)

export const gym: Gym = {
  gym_id: GYM_ID,
  gym_name: 'Iron Republic Gym, CDO',
  slug: 'iron-republic-cdo',
  logo_url: null,
  brand_color: null,
  timezone: 'Asia/Manila',
  status: 'active',
  city: 'Cagayan de Oro',
  monthly_fee_centavos: 150_000,
  billing_cycle: 'monthly',
  annual_discount_percent: 10,
  setup_fee_centavos: 150_000,
  setup_fee_paid_at: `${daysFromToday(-199)}T02:00:00.000Z`,
  next_due_date: daysFromToday(20),
  created_at: `${daysFromToday(-200)}T01:00:00.000Z`,
}
