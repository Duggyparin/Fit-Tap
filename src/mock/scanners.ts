import type { Scanner } from '../types'
import { GYM_ID } from './gym'
import { minutesAgo, mockId } from './helpers'

export const FRONT_DOOR_ID = mockId(21)
export const BACK_DOOR_ID = mockId(22)

export const scanners: Scanner[] = [
  {
    scanner_id: FRONT_DOOR_ID,
    gym_id: GYM_ID,
    scanner_name: 'Front door',
    firmware_version: '1.3.0',
    last_seen_at: minutesAgo(1), // online
    status: 'active',
    is_default: true,
  },
  {
    scanner_id: BACK_DOOR_ID,
    gym_id: GYM_ID,
    scanner_name: 'Back door',
    firmware_version: '1.3.0',
    last_seen_at: minutesAgo(180), // offline: last seen 3 hours ago
    status: 'active',
    is_default: false,
  },
]
