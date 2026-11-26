import type { AppUser } from '../types'
import { GYM_ID } from './gym'
import { daysFromToday, mockId } from './helpers'

export const OWNER_ID = mockId(11)
export const STAFF_ID = mockId(12)
export const ADMIN_ID = mockId(13)

export const appUsers: AppUser[] = [
  {
    user_id: OWNER_ID,
    gym_id: GYM_ID,
    role: 'owner',
    display_name: 'Ramil Gonzaga',
    email: 'owner@example.com',
    is_active: true,
    invited_at: null,
    accepted_at: `${daysFromToday(-199)}T02:00:00.000Z`,
  },
  {
    user_id: STAFF_ID,
    gym_id: GYM_ID,
    role: 'staff',
    display_name: 'Joy Pacquiao',
    email: 'frontdesk@example.com',
    is_active: true,
    invited_at: null,
    accepted_at: `${daysFromToday(-150)}T02:00:00.000Z`,
  },
  {
    user_id: ADMIN_ID,
    gym_id: null,
    role: 'platform_admin',
    display_name: 'Platform Admin',
    email: 'admin@example.com',
    is_active: true,
    invited_at: null,
    accepted_at: `${daysFromToday(-300)}T02:00:00.000Z`,
  },
]
