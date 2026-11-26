// Data the platform admin sees: three more gyms in different situations, their
// subscription payments, scanners, card orders and past admin actions.

import type {
  AppUser,
  AuditAction,
  AuditEntry,
  CardBatch,
  Checkin,
  Gym,
  GymPayment,
  Member,
  Membership,
  Payment,
  Plan,
  Scanner,
} from '../types'
import { ADMIN_ID } from './appUsers'
import { GYM_ID } from './gym'
import { daysFromToday, minutesAgo, mockId, pesos, todayMinutesAgo } from './helpers'

export const PULSE_ID = mockId(2) // trial, stuck in onboarding
export const BARRIO_ID = mockId(3) // overdue, still in the grace period
export const SUMMIT_ID = mockId(4) // suspended

const stamp = (daysAgo: number) => `${daysFromToday(-daysAgo)}T02:00:00.000Z`

function gym(
  gym_id: string,
  gym_name: string,
  city: string,
  status: Gym['status'],
  createdDaysAgo: number,
  fee: number,
  dueInDays: number | null,
): Gym {
  return {
    gym_id,
    gym_name,
    slug: gym_name.toLowerCase().replace(/[^a-z]+/g, '-'),
    logo_url: null,
    brand_color: null,
    timezone: 'Asia/Manila',
    status,
    created_at: stamp(createdDaysAgo),
    city,
    monthly_fee_centavos: pesos(fee),
    next_due_date: dueInDays === null ? null : daysFromToday(dueInDays),
  }
}

export const gyms: Gym[] = [
  gym(PULSE_ID, 'Pulse Fitness', 'Iligan', 'trial', 12, 1000, null),
  gym(BARRIO_ID, 'Barrio Strength', 'Valencia', 'active', 95, 1200, -4),
  gym(SUMMIT_ID, 'Summit Gym', 'Malaybalay', 'suspended', 160, 1500, -41),
]

function owner(n: number, gym_id: string, name: string, email: string, accepted: boolean): AppUser {
  return {
    user_id: mockId(n),
    gym_id,
    role: 'owner',
    display_name: name,
    email,
    is_active: true,
    invited_at: stamp(12),
    accepted_at: accepted ? stamp(10) : null,
  }
}

export const users: AppUser[] = [
  owner(14, PULSE_ID, 'Lourdes Abella', 'pulse.owner@example.com', false),
  owner(15, BARRIO_ID, 'Dodong Lacson', 'barrio.owner@example.com', true),
  owner(16, SUMMIT_ID, 'Cherry Uy', 'summit.owner@example.com', true),
]

const BARRIO_PLAN = mockId(37)
const SUMMIT_PLAN = mockId(38)

export const plans: Plan[] = [
  { plan_id: BARRIO_PLAN, gym_id: BARRIO_ID, plan_name: 'Monthly', duration_days: 30, price_centavos: pesos(900), is_active: true },
  { plan_id: SUMMIT_PLAN, gym_id: SUMMIT_ID, plan_name: 'Monthly', duration_days: 30, price_centavos: pesos(1100), is_active: true },
]

const people: [number, string, string, string, number][] = [
  // id, gym, name, plan, membership ends in N days
  [121, BARRIO_ID, 'Rodel Cabrera', BARRIO_PLAN, 21],
  [122, BARRIO_ID, 'Joan Pimentel', BARRIO_PLAN, 12],
  [123, BARRIO_ID, 'Aldrin Sy', BARRIO_PLAN, 3],
  [124, BARRIO_ID, 'Mylene Torres', BARRIO_PLAN, -8],
  [125, SUMMIT_ID, 'Gerald Ocampo', SUMMIT_PLAN, -10],
  [126, SUMMIT_ID, 'Faith Mercado', SUMMIT_PLAN, 5],
]

export const members: Member[] = people.map(([n, gym_id, full_name]) => ({
  member_id: mockId(n),
  gym_id,
  full_name,
  phone: `0919 ${n} 0000`,
  email: null,
  photo_url: null,
  consent_at: stamp(60),
  status: 'active',
  created_at: stamp(60),
}))

export const memberships: Membership[] = people.map(([n, gym_id, , plan_id, endsIn]) => ({
  membership_id: mockId(n + 200),
  gym_id,
  member_id: mockId(n),
  plan_id,
  start_date: daysFromToday(endsIn - 29),
  end_date: daysFromToday(endsIn),
  status: 'active',
  created_by: ADMIN_ID,
}))

export const payments: Payment[] = memberships.map((m, i) => ({
  payment_id: mockId(460 + i),
  membership_id: m.membership_id,
  amount_centavos: pesos(m.gym_id === BARRIO_ID ? 900 : 1100),
  method: 'cash',
  reference_no: null,
  paid_at: `${m.start_date}T02:30:00.000Z`,
  recorded_by: ADMIN_ID,
}))

function checkin(n: number, gym_id: string, member: number, scanner: number, at: string): Checkin {
  return {
    checkin_id: mockId(n),
    gym_id,
    member_id: mockId(member),
    scanner_id: mockId(scanner),
    card_uid: null,
    result: 'allowed',
    source: 'online',
    scanned_at: at,
    synced_at: at,
  }
}

export const checkins: Checkin[] = [
  checkin(560, BARRIO_ID, 121, 23, todayMinutesAgo(150)),
  checkin(561, BARRIO_ID, 122, 23, todayMinutesAgo(135)),
  checkin(562, SUMMIT_ID, 126, 24, stamp(22)),
]

function scanner(
  n: number,
  gym_id: string | null,
  scanner_name: string,
  lastSeen: string | null,
  hardware_status: Scanner['hardware_status'],
  status: Scanner['status'] = 'active',
): Scanner {
  return {
    scanner_id: mockId(n),
    gym_id,
    scanner_name,
    firmware_version: lastSeen ? '1.3.0' : null,
    last_seen_at: lastSeen,
    status,
    hardware_status,
    is_default: gym_id !== null && hardware_status === 'at_gym',
  }
}

export const scanners: Scanner[] = [
  scanner(25, PULSE_ID, 'Entrance', null, 'at_gym'),
  scanner(23, BARRIO_ID, 'Main door', minutesAgo(120), 'at_gym'),
  scanner(24, SUMMIT_ID, 'Front desk', stamp(22), 'at_gym'),
  scanner(26, null, 'Spare box A', null, 'in_stock'),
  scanner(27, null, 'Repair box B', stamp(40), 'in_repair'),
]

function batch(n: number, gym_id: string, quantity: number, status: CardBatch['status'], daysAgo: number, price: number): CardBatch {
  return {
    batch_id: mockId(n),
    gym_id,
    quantity,
    chip_type: 'NTAG215',
    design_url: null,
    price_centavos: pesos(price),
    status,
    ordered_at: stamp(daysAgo),
  }
}

export const cardBatches: CardBatch[] = [
  batch(43, PULSE_ID, 50, 'ordered', 3, 2500),
  batch(44, BARRIO_ID, 30, 'shipped', 9, 1650),
]

function paid(n: number, gym_id: string, amount: number, daysAgo: number): GymPayment {
  return {
    gym_payment_id: mockId(n),
    gym_id,
    amount_centavos: pesos(amount),
    method: 'gcash',
    reference_no: `SUB${n}`,
    paid_at: stamp(daysAgo),
    covers_due_date: daysFromToday(-daysAgo),
    recorded_by: ADMIN_ID,
  }
}

export const gymPayments: GymPayment[] = [
  paid(801, GYM_ID, 1500, 41),
  paid(802, GYM_ID, 1500, 10),
  paid(803, BARRIO_ID, 1200, 35),
  paid(804, SUMMIT_ID, 1500, 72),
]

function audit(n: number, action: AuditAction, gym_id: string, detail: string, daysAgo: number): AuditEntry {
  return {
    audit_id: mockId(n),
    actor_user_id: ADMIN_ID,
    action,
    gym_id,
    detail,
    created_at: stamp(daysAgo),
  }
}

export const auditLog: AuditEntry[] = [
  audit(901, 'gym_suspended', SUMMIT_ID, 'Suspended for non-payment', 20),
  audit(902, 'gym_added', PULSE_ID, 'Added Pulse Fitness', 12),
  audit(903, 'owner_invited', PULSE_ID, 'Invited pulse.owner@example.com', 12),
  audit(904, 'payment_recorded', GYM_ID, '₱1,500 by GCash', 10),
  audit(905, 'batch_registered', GYM_ID, '15 cards saved as stock', 90),
]
