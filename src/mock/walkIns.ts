import type { WalkIn } from '../types'
import { OWNER_ID, STAFF_ID } from './appUsers'
import { GYM_ID } from './gym'
import { todayMinutesAgo, mockId, pesos } from './helpers'

// Today's pay-per-visit guests. No card, no member record.
export const walkIns: WalkIn[] = [
  {
    walkin_id: mockId(701),
    gym_id: GYM_ID,
    guest_name: null,
    amount_centavos: pesos(100),
    method: 'cash',
    reference_no: null,
    visited_at: todayMinutesAgo(12),
    recorded_by: STAFF_ID,
  },
  {
    walkin_id: mockId(702),
    gym_id: GYM_ID,
    guest_name: 'Rico Navarro',
    amount_centavos: pesos(100),
    method: 'gcash',
    reference_no: 'REF903114',
    visited_at: todayMinutesAgo(48),
    recorded_by: STAFF_ID,
  },
  {
    walkin_id: mockId(703),
    gym_id: GYM_ID,
    guest_name: 'Lea Cruz',
    amount_centavos: pesos(100),
    method: 'maya',
    reference_no: 'REF903587',
    visited_at: todayMinutesAgo(102),
    recorded_by: OWNER_ID,
  },
  {
    walkin_id: mockId(704),
    gym_id: GYM_ID,
    guest_name: null,
    amount_centavos: pesos(100),
    method: 'cash',
    reference_no: null,
    visited_at: todayMinutesAgo(165),
    recorded_by: STAFF_ID,
  },
]
