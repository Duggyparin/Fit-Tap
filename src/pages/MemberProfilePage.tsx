import { ArrowLeft, CircleCheck, CreditCard, RefreshCw, UserRoundX, UserX } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Button from '../components/Button'
import ButtonLink from '../components/ButtonLink'
import ConfirmDialog from '../components/ConfirmDialog'
import DaysLeftBadge from '../components/DaysLeftBadge'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import ManualCheckinDialog from '../components/ManualCheckinDialog'
import MemberHistory from '../components/MemberHistory'
import MemberPhoto from '../components/MemberPhoto'
import StatusBadge, { MembershipBadge } from '../components/StatusBadge'
import { anonymizeMember, useIsOwner, useMember } from '../lib/data'
import { formatDate } from '../lib/format'
import { NO_CARD_STATUS } from '../lib/status'
import { useOnline } from '../lib/useOnline'

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
    </div>
  )
}

export default function MemberProfilePage() {
  const { id } = useParams()
  const { data: record, isLoading } = useMember(id)
  const [checkingIn, setCheckingIn] = useState(false)
  const [anonymizing, setAnonymizing] = useState(false)
  const isOwner = useIsOwner()
  const online = useOnline()

  if (isLoading) return <p className="text-sm text-ink-muted">Loading member…</p>

  if (!record) {
    return (
      <EmptyState
        icon={UserX}
        title="Member not found"
        text="This member does not exist or was removed."
        action={<ButtonLink to="/members">Back to members</ButtonLink>}
      />
    )
  }

  const { member, status, plan, endDate, card } = record
  const removed = member.anonymized_at
  const stillRunning = status === 'active' || status === 'expiring' || status === 'frozen'

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/members"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary"
      >
        <Icon icon={ArrowLeft} size={18} />
        Members
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <MemberPhoto member={member} size="lg" />
            <h1 className="text-2xl font-bold text-navy">{member.full_name}</h1>
            {!removed && (
              <div className="flex flex-wrap justify-center gap-2">
                <MembershipBadge state={status} />
                {!card && <StatusBadge {...NO_CARD_STATUS} />}
              </div>
            )}
          </div>

          {removed ? (
            <p className="rounded-lg border border-line bg-page p-4 text-sm">
              Personal details were removed on {formatDate(removed)}. Payments, memberships and
              check-ins are kept for the gym’s totals.
            </p>
          ) : (
            <>
              <dl className="divide-y divide-line text-sm">
                <Detail label="Phone" value={member.phone} />
                <Detail label="Email" value={member.email ?? '—'} />
                <Detail label="Plan" value={plan?.plan_name ?? 'No plan'} />
                <Detail label="End date" value={endDate ? formatDate(endDate) : '—'} />
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-ink-muted">Days left</dt>
                  <dd>
                    <DaysLeftBadge record={record} />
                  </dd>
                </div>
                <Detail
                  label="Card number"
                  value={card ? (card.card_number ?? 'Plain card') : 'No card'}
                />
                <Detail
                  label="Privacy consent"
                  value={`${formatDate(member.consent_at)} · notice ${member.consent_version ?? 'not recorded'}`}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <Button icon={CircleCheck} onClick={() => setCheckingIn(true)}>
                  Check in manually
                </Button>
                <ButtonLink variant="secondary" icon={RefreshCw} to={`/renew?member=${member.member_id}`}>
                  Renew
                </ButtonLink>
                {/* Disabling the old card comes with the Link card page. */}
                <ButtonLink
                  variant="secondary"
                  icon={CreditCard}
                  to={`/members/${member.member_id}/link-card`}
                >
                  {card ? 'Replace card' : 'Link card'}
                </ButtonLink>
              </div>
              {isOwner && (
                <div className="border-t border-line pt-3">
                  <Button
                    variant="secondary"
                    icon={UserRoundX}
                    onClick={() => setAnonymizing(true)}
                    disabled={!online}
                    className="w-full"
                  >
                    Anonymize member
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* key: start on the first tab when moving to another member. */}
        <MemberHistory key={member.member_id} member={record} />
      </div>

      {checkingIn && (
        <ManualCheckinDialog memberId={member.member_id} onClose={() => setCheckingIn(false)} />
      )}
      {anonymizing && (
        <ConfirmDialog
          title="Anonymize member?"
          message={`This removes the name, phone number, email and photo of ${member.full_name}, and disables their card. It cannot be undone. Payments, memberships and check-ins are kept.${stillRunning ? ' Their membership has not ended: they will no longer be able to enter.' : ''}`}
          confirmText="Remove personal details"
          onClose={() => setAnonymizing(false)}
          onConfirm={() => {
            anonymizeMember(member.member_id)
            setAnonymizing(false)
          }}
        />
      )}
    </div>
  )
}
