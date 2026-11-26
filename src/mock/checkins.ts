import type { Checkin, CheckinResult, CheckinSource } from '../types'
import { GYM_ID } from './gym'
import { todayMinutesAgo, mockId } from './helpers'
import { M } from './members'
import { BACK_DOOR_ID, FRONT_DOOR_ID } from './scanners'

function checkin(
  n: number,
  minutes: number,
  member_id: string | null,
  card_uid: string | null,
  result: CheckinResult,
  source: CheckinSource,
  scanner_id: string | null = source === 'manual' ? null : FRONT_DOOR_ID,
): Checkin {
  const at = todayMinutesAgo(minutes)
  return {
    checkin_id: mockId(n),
    gym_id: GYM_ID,
    member_id,
    scanner_id,
    card_uid,
    result,
    source,
    scanned_at: at,
    synced_at: at,
  }
}

// Today's check-ins, newest first. Includes allowed and denied taps, manual
// check-ins (no card) and three unknown cards for "Choose from recent taps".
export const checkins: Checkin[] = [
  checkin(501, 2, M.juan, '04A1B2C3D4E5F6', 'allowed', 'online'),
  checkin(502, 4, null, '04FA11223344A1', 'unknown', 'online'), // unknown card
  checkin(503, 9, M.maria, '04B7C1D2E3F401', 'allowed', 'online'),
  checkin(504, 14, M.paolo, '04C2D3E4F50612', 'expired', 'online'),
  checkin(505, 21, M.angela, null, 'allowed', 'manual'), // forgot her card
  checkin(506, 28, null, '04FB55667788B2', 'unknown', 'online'), // unknown card
  checkin(507, 33, M.nina, '0406172839AB56', 'frozen', 'online'),
  checkin(508, 40, M.miguel, '04D3E4F5061723', 'allowed', 'online', BACK_DOOR_ID),
  checkin(509, 47, M.rhea, '04BCDEF0123AAB', 'disabled', 'online'), // lost card
  checkin(510, 52, M.rhea, null, 'allowed', 'manual'),
  checkin(511, 55, null, '04FC99AABBCCC3', 'unknown', 'online', BACK_DOOR_ID), // unknown card
  checkin(512, 70, M.kristine, '04E4F506172834', 'allowed', 'online'),
  checkin(513, 95, M.jose, '04172839ABCD67', 'expired', 'online'),
  checkin(514, 130, M.bea, '04ABCDEF01239A', 'allowed', 'online'),
]
