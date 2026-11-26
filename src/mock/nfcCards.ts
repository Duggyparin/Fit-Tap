import type { CardStatus, NfcCard } from '../types'
import { BATCH_ID } from './cardBatches'
import { GYM_ID } from './gym'
import { daysFromToday, mockId } from './helpers'
import { M } from './members'

function card(
  n: number,
  card_uid: string,
  card_number: string | null,
  member_id: string | null,
  status: CardStatus,
  assignedDaysAgo: number | null,
): NfcCard {
  return {
    card_id: mockId(n),
    gym_id: GYM_ID,
    member_id,
    batch_id: card_number ? BATCH_ID : null, // printed number = branded batch card
    card_uid,
    card_number,
    status,
    assigned_at: assignedDaysAgo === null ? null : `${daysFromToday(-assignedDaysAgo)}T02:05:00.000Z`,
  }
}

export const nfcCards: NfcCard[] = [
  // Linked, active cards
  card(201, '04A1B2C3D4E5F6', 'IR-0001', M.juan, 'active', 160),
  card(202, '04B7C1D2E3F401', 'IR-0002', M.maria, 'active', 86),
  card(203, '04C2D3E4F50612', 'IR-0003', M.paolo, 'active', 120),
  card(204, 'A1B2C3D4', null, M.angela, 'active', 18), // plain MIFARE card, no batch
  card(205, '04D3E4F5061723', 'IR-0004', M.miguel, 'active', 115),
  card(206, '04E4F506172834', 'IR-0005', M.kristine, 'active', 30),
  card(207, '04F50617283945', 'IR-0006', M.carlo, 'active', 5),
  card(208, '0406172839AB56', 'IR-0007', M.nina, 'active', 45),
  card(209, '04172839ABCD67', 'IR-0008', M.jose, 'active', 150),
  card(210, '042839ABCDEF78', 'IR-0009', M.mark, 'active', 23),
  card(211, '0439ABCDEF0189', 'IR-0010', M.andrea, 'active', 265),
  card(212, '04ABCDEF01239A', 'IR-0011', M.bea, 'active', 21),

  // Rhea reported her card lost; she needs a replacement (no active card).
  card(213, '04BCDEF0123AAB', 'IR-0012', M.rhea, 'lost', 15),

  // Branded cards in stock, ready to link by card number
  card(214, '04CDEF01234BBC', 'IR-0013', null, 'stock', null),
  card(215, '04DEF012345CCD', 'IR-0014', null, 'stock', null),
  card(216, '04EF0123456DDE', 'IR-0015', null, 'stock', null),

  // Belongs to another gym, to test that it cannot be linked here.
  { ...card(217, '04F0123456EEF1', 'OT-0001', null, 'stock', null), gym_id: mockId(2), batch_id: null },
]
