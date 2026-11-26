import type { LinkRequest } from '../types'
import { OWNER_ID, STAFF_ID } from './appUsers'
import { GYM_ID } from './gym'
import { minutesAgo, mockId, secondsFromNow } from './helpers'
import { M } from './members'
import { FRONT_DOOR_ID } from './scanners'

export const linkRequests: LinkRequest[] = [
  // Waiting: Jerome was registered today and is about to tap his new card.
  // (It is only "pending" for about a minute after the app loads.)
  {
    request_id: mockId(601),
    gym_id: GYM_ID,
    scanner_id: FRONT_DOOR_ID,
    member_id: M.jerome,
    requested_by: STAFF_ID,
    status: 'pending',
    card_uid: null,
    expires_at: secondsFromNow(45),
  },
  // Finished: how Juan's card was linked.
  {
    request_id: mockId(602),
    gym_id: GYM_ID,
    scanner_id: FRONT_DOOR_ID,
    member_id: M.juan,
    requested_by: OWNER_ID,
    status: 'done',
    card_uid: '04A1B2C3D4E5F6',
    expires_at: minutesAgo(160 * 24 * 60 - 1),
  },
]
