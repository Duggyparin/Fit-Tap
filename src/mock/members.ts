import type { Member } from '../types'
import { GYM_ID } from './gym'
import { daysFromToday, mockId } from './helpers'

// Member IDs by short name, so other mock files can refer to them clearly.
export const M = {
  juan: mockId(101), // active, monthly, has card
  maria: mockId(102), // expiring (4 days), quarterly
  paolo: mockId(103), // expired 6 days ago
  angela: mockId(104), // active, student monthly
  miguel: mockId(105), // active, annual
  kristine: mockId(106), // last day today (0 days left)
  carlo: mockId(107), // expiring (2 days), weekly
  nina: mockId(108), // frozen
  jose: mockId(109), // expired 30 days ago
  liza: mockId(110), // active, NO card
  mark: mockId(111), // expiring (exactly 7 days)
  rhea: mockId(112), // active, but her card is marked lost (no active card)
  jerome: mockId(113), // registered today, NO card yet (pending link request)
  andrea: mockId(114), // membership cancelled
  bea: mockId(115), // active, monthly
}

function member(id: string, full_name: string, phone: string, joinedDaysAgo: number, email: string | null = null): Member {
  const joined = `${daysFromToday(-joinedDaysAgo)}T02:00:00.000Z`
  return {
    member_id: id,
    gym_id: GYM_ID,
    full_name,
    phone,
    email,
    photo_url: null, // no real photos in mock data; the UI shows initials
    consent_at: joined,
    status: 'active',
    created_at: joined,
  }
}

export const members: Member[] = [
  member(M.juan, 'Juan Dela Cruz', '0917 345 9821', 160, 'juan.delacruz@example.com'),
  member(M.maria, 'Maria Santos', '0928 114 6203', 86),
  member(M.paolo, 'Paolo Reyes', '0915 720 4486', 120),
  member(M.angela, 'Angela Garcia', '0998 361 0274', 18, 'angela.garcia@example.com'),
  member(M.miguel, 'Miguel Mendoza', '0916 882 1940', 115),
  member(M.kristine, 'Kristine Bautista', '0927 553 1186', 30),
  member(M.carlo, 'Carlo Aquino', '0905 219 7734', 5),
  member(M.nina, 'Nina Villanueva', '0939 640 2215', 45),
  member(M.jose, 'Jose Ramos', '0918 207 5591', 150),
  member(M.liza, 'Liza Navarro', '0926 771 3048', 3),
  member(M.mark, 'Mark Santiago', '0917 902 6651', 23),
  member(M.rhea, 'Rhea Domingo', '0995 318 4402', 15, 'rhea.domingo@example.com'),
  member(M.jerome, 'Jerome Castillo', '0909 456 1273', 0),
  member(M.andrea, 'Andrea Flores', '0920 885 3367', 265),
  member(M.bea, 'Bea Lopez', '0947 130 9958', 21),
]
