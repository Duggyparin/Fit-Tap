// The member privacy notice and the data retention rule, in one place.
//
// DRAFT - to be reviewed. This wording has not been checked by a lawyer or a
// data protection officer. When the text changes, raise PRIVACY_VERSION: each
// member keeps the version they accepted.

import type { DateString, Member, Membership } from '../types'
import { SUPPORT_EMAIL } from './config'
import { todayInManila } from './format'
import { addMonth } from './platform'

export const PRIVACY_VERSION = '2026-11-draft1'
export const PRIVACY_STATUS = 'DRAFT - to be reviewed'
export const RETENTION_MONTHS = 12 // after the last membership ends

export interface PrivacyContact {
  name: string // the gym owner
  detail: string // phone number or email
}

export function privacyNotice(
  gymName: string,
  contact: PrivacyContact,
): { title: string; text: string }[] {
  return [
    {
      title: 'Who is responsible',
      text: `${gymName} is responsible for your personal data. FitTap provides the system the gym uses and handles the data for the gym.`,
    },
    {
      title: 'What is stored',
      text: 'Your name, phone number, email address (if you give one), photo, NFC card number, memberships, payment records and check-in times.',
    },
    {
      title: 'Why',
      text: 'To manage your membership, check you in at the door, confirm that the person using a card is you, and keep payment and attendance records.',
    },
    {
      title: 'Who can see it',
      text: 'The gym’s owner and staff, and FitTap when it is needed to run or support the system. It is not sold.',
    },
    {
      title: 'How long it is kept',
      text: 'Your name, contact details and photo are kept until 1 year after your last membership ends, then removed. Payment and attendance records stay without your personal details.',
    },
    {
      title: 'Your rights',
      text: 'Under the Data Privacy Act of 2012 (RA 10173) you may ask to see, correct or delete your personal data, and you may withdraw your consent.',
    },
    {
      title: 'Contact',
      text: `Ask the gym: ${contact.name} (${contact.detail}). If you cannot reach the gym, write to FitTap support: ${SUPPORT_EMAIL}.`,
    },
  ]
}

// True when a member's personal details are due to be removed: their last
// membership ended more than RETENTION_MONTHS ago.
export function retentionDue(
  member: Pick<Member, 'member_id' | 'created_at' | 'anonymized_at'>,
  memberships: Pick<Membership, 'member_id' | 'end_date'>[],
  today: DateString = todayInManila(),
): boolean {
  if (member.anonymized_at) return false
  const lastEnd =
    memberships
      .filter((m) => m.member_id === member.member_id)
      .map((m) => m.end_date)
      .sort()
      .at(-1) ?? todayInManila(new Date(member.created_at))
  return addMonth(lastEnd, RETENTION_MONTHS) < today
}
