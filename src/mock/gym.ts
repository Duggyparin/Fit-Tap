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
  created_at: `${daysFromToday(-200)}T01:00:00.000Z`,
}
