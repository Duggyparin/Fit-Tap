import type { AppUser } from '../types'
import { GYM_ID } from './gym'
import { mockId } from './helpers'

export const OWNER_ID = mockId(11)
export const STAFF_ID = mockId(12)

export const appUsers: AppUser[] = [
  {
    user_id: OWNER_ID,
    gym_id: GYM_ID,
    role: 'owner',
    display_name: 'Ramil Gonzaga',
    email: 'owner@example.com',
    is_active: true,
  },
  {
    user_id: STAFF_ID,
    gym_id: GYM_ID,
    role: 'staff',
    display_name: 'Joy Pacquiao',
    email: 'frontdesk@example.com',
    is_active: true,
  },
]
