// Types for the website, based on the FULL ERD in the project plan (v1.3).
// The database is supabase/migrations/20261126000000_fittap_schema.sql;
// open items are listed in docs/schema-todo.md.
//
// Conventions:
// - IDs are UUID strings.
// - Money is an integer number of centavos (₱1,500 = 150000).
// - Dates without a time ("2026-11-26") are strings in YYYY-MM-DD form.
// - Timestamps are ISO strings ("2026-11-26T07:42:00.000Z").

export type Uuid = string
export type DateString = string // YYYY-MM-DD, a calendar day in Asia/Manila
export type Timestamp = string // ISO 8601

// ---------- Status and option values ----------

export type GymStatus = 'trial' | 'active' | 'suspended'
export type UserRole = 'owner' | 'staff' | 'platform_admin'
export type ScannerStatus = 'active' | 'disabled' // disabled = revoked
export type HardwareStatus = 'in_stock' | 'at_gym' | 'in_repair'
export type MemberStatus = 'active' | 'archived'
export type CardStatus = 'stock' | 'active' | 'lost' | 'disabled'

// 'expired' is not stored: a membership is expired when end_date < today
// in Manila. See membershipState() in src/lib/membership.ts.
export type MembershipStatus = 'active' | 'frozen' | 'cancelled'

export type PaymentMethod = 'cash' | 'gcash' | 'maya' | 'other'

// What happened on a check-in. 'frozen' is new (index.ts does not send it yet).
export type CheckinResult = 'allowed' | 'expired' | 'frozen' | 'unknown' | 'disabled'
// online/offline = tapped on a scanner; manual = checked in by staff.
export type CheckinSource = 'online' | 'offline' | 'manual'

export type LinkRequestStatus = 'pending' | 'done' | 'expired' | 'cancelled'
// What the check-in function answers in link mode.
export type LinkResult = 'linked' | 'already_linked' | 'other_gym'

export type CardBatchStatus = 'ordered' | 'printing' | 'shipped' | 'received'

// Everything the platform admin can do; each one is written to the audit log.
export type AuditAction =
  | 'gym_added'
  | 'owner_invited'
  | 'invite_resent'
  | 'payment_recorded'
  | 'gym_suspended'
  | 'gym_reactivated'
  | 'view_as_started'
  | 'scanner_registered'
  | 'token_rotated'
  | 'scanner_revoked'
  | 'default_scanner_set'
  | 'batch_registered'
  | 'batch_status_changed'
  | 'billing_changed'

export type BillingCycle = 'monthly' | 'annual'
export type GymPaymentKind = 'subscription' | 'setup'

// What a gym's owner or staff did (separate from the platform admin's log).
export type GymAuditAction = 'qr_added' | 'qr_changed' | 'qr_removed' | 'member_anonymized'

// ---------- Tables ----------

export interface Gym {
  gym_id: Uuid
  gym_name: string
  slug: string
  logo_url: string | null
  brand_color: string | null
  timezone: string
  status: GymStatus
  created_at: Timestamp
  city: string
  // Subscription to FitTap (what the gym pays the platform).
  monthly_fee_centavos: number
  next_due_date: DateString | null // null while on trial
  billing_cycle: BillingCycle
  annual_discount_percent: number // used when billing_cycle is 'annual'
  setup_fee_centavos: number // one-time
  setup_fee_paid_at: Timestamp | null
}

export interface GymPayment {
  gym_payment_id: Uuid
  gym_id: Uuid
  kind: GymPaymentKind
  amount_centavos: number
  method: PaymentMethod
  reference_no: string | null
  paid_at: Timestamp
  covers_due_date: DateString | null // the due date this payment settled
  recorded_by: Uuid
}

export interface AuditEntry {
  audit_id: Uuid
  actor_user_id: Uuid
  action: AuditAction
  gym_id: Uuid | null
  detail: string // never contains secrets or tokens
  created_at: Timestamp
}

export interface GymAuditEntry {
  gym_audit_id: Uuid
  gym_id: Uuid
  actor_user_id: Uuid | null // null = done automatically by the system
  action: GymAuditAction
  detail: string // never contains a removed member's personal details
  created_at: Timestamp
}

export interface AppUser {
  user_id: Uuid
  gym_id: Uuid | null // null only for the platform admin
  role: UserRole
  display_name: string
  email: string
  is_active: boolean
  invited_at: Timestamp | null
  accepted_at: Timestamp | null // null = invite not accepted yet
}

export interface Scanner {
  scanner_id: Uuid
  gym_id: Uuid | null // null = in stock, not assigned to a gym
  scanner_name: string
  // token_hash is server-only and never sent to the website.
  firmware_version: string | null
  last_seen_at: Timestamp | null
  status: ScannerStatus
  hardware_status: HardwareStatus
  is_default: boolean // the scanner the Link card page uses automatically
}

export interface Member {
  member_id: Uuid
  gym_id: Uuid
  full_name: string
  phone: string
  email: string | null
  photo_url: string | null // required for new members; null only in old/mock data
  consent_at: Timestamp
  consent_version: string | null // the privacy notice version they accepted
  anonymized_at: Timestamp | null // personal details removed
  status: MemberStatus
  created_at: Timestamp
}

export interface NfcCard {
  card_id: Uuid
  gym_id: Uuid
  member_id: Uuid | null // null = in stock, not linked
  batch_id: Uuid | null // null = plain card bought by the gym
  card_uid: string // factory ID read by the scanner, e.g. "04A1B2C3D4E5F6"
  card_number: string | null // short number printed on branded cards
  status: CardStatus
  assigned_at: Timestamp | null
}

export interface LinkRequest {
  request_id: Uuid
  gym_id: Uuid
  scanner_id: Uuid
  member_id: Uuid
  requested_by: Uuid
  status: LinkRequestStatus
  card_uid: string | null // filled in when a card is tapped
  // What happened to the tapped card, saved by the scanner tap so the
  // website can show "already linked", "other gym" or "blocked".
  result: LinkResult | null
  expires_at: Timestamp
}

export interface CardBatch {
  batch_id: Uuid
  gym_id: Uuid
  quantity: number
  chip_type: string
  design_url: string | null
  price_centavos: number
  status: CardBatchStatus
  ordered_at: Timestamp
}

export interface Plan {
  plan_id: Uuid
  gym_id: Uuid
  plan_name: string
  duration_days: number
  price_centavos: number
  is_active: boolean // retired plans stay for history
}

export interface Membership {
  membership_id: Uuid
  gym_id: Uuid
  member_id: Uuid
  plan_id: Uuid
  start_date: DateString
  end_date: DateString // the source of truth for access
  status: MembershipStatus
  created_by: Uuid
}

export interface Payment {
  payment_id: Uuid
  membership_id: Uuid
  amount_centavos: number
  method: PaymentMethod
  reference_no: string | null // for GCash / Maya
  paid_at: Timestamp
  recorded_by: Uuid
}

export interface WalkIn {
  walkin_id: Uuid
  gym_id: Uuid
  guest_name: string | null
  amount_centavos: number
  method: PaymentMethod
  reference_no: string | null
  visited_at: Timestamp // filled in automatically
  recorded_by: Uuid
}

export interface Checkin {
  checkin_id: Uuid
  gym_id: Uuid
  member_id: Uuid | null // null for unknown cards
  scanner_id: Uuid | null // null for manual check-ins
  card_uid: string | null // null for manual check-ins
  result: CheckinResult
  source: CheckinSource
  scanned_at: Timestamp // device time (or browser time for manual)
  synced_at: Timestamp | null // server time
}
