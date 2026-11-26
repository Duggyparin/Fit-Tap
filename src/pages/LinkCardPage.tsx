import { ArrowLeft, ChevronRight, CircleCheck, CreditCard, History, Keyboard, Radio, UserX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Button from '../components/Button'
import ButtonLink from '../components/ButtonLink'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import CardNumberLink from '../components/link/CardNumberLink'
import RecentTapsLink from '../components/link/RecentTapsLink'
import ScannerLink from '../components/link/ScannerLink'
import MemberPhoto from '../components/MemberPhoto'
import {
  endLinkRequest,
  markCardsLost,
  startLinkRequest,
  useLinkRequest,
  useMember,
  useScanners,
  type MemberDetail,
} from '../lib/data'
import { useOnline } from '../lib/useOnline'

type Step = 'choose' | 'scanner' | 'recent' | 'number'

const METHODS = [
  { step: 'scanner', icon: Radio, title: 'Tap on scanner', text: 'The member taps the card now', recommended: true },
  { step: 'recent', icon: History, title: 'Choose from recent taps', text: 'Pick an unknown card that was tapped' },
  { step: 'number', icon: Keyboard, title: 'Type card number', text: 'Enter the number printed on the card' },
] as const

const SUCCESS_MS = 2500

export default function LinkCardPage() {
  const { id } = useParams()
  const member = useMember(id).data
  if (!member) {
    return (
      <EmptyState
        icon={UserX}
        title="Member not found"
        text="This member does not exist or was removed."
        action={<ButtonLink to="/members">Back to members</ButtonLink>}
      />
    )
  }
  // key: start fresh if the address changes to another member.
  return <LinkSteps key={member.member.member_id} record={member} />
}

function LinkSteps({ record }: { record: MemberDetail }) {
  const { member, card } = record
  const profile = `/members/${member.member_id}`
  const navigate = useNavigate()
  const online = useOnline()

  const scanners = useScanners().data.filter((s) => s.scanner.status === 'active')
  const [step, setStep] = useState<Step>('choose')
  const [picked, setPicked] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [linkedByHand, setLinkedByHand] = useState(false)
  const request = useLinkRequest(requestId).data
  // The default scanner is first in the list.
  const scannerId = picked ?? scanners[0]?.scanner.scanner_id ?? ''
  const linked = linkedByHand || request?.status === 'done'

  // Leaving the page cancels a request that is still waiting. The timeout skips
  // React's development double-mount.
  const waitingId = useRef<string | null>(null)
  const mounted = useRef(false)
  useEffect(() => {
    waitingId.current = requestId
  }, [requestId])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      window.setTimeout(() => {
        if (!mounted.current && waitingId.current) endLinkRequest(waitingId.current, 'cancelled')
      })
    }
  }, [])

  // After success, return to the profile.
  useEffect(() => {
    if (!linked) return
    const timer = window.setTimeout(() => navigate(profile, { replace: true }), SUCCESS_MS)
    return () => window.clearTimeout(timer)
  }, [linked, navigate, profile])

  function start(id = scannerId) {
    const next = startLinkRequest(member.member_id, id)
    setBusy(next === null)
    setRequestId(next?.request_id ?? null)
  }

  function stopWaiting() {
    if (requestId) endLinkRequest(requestId, 'cancelled')
    setRequestId(null)
    setBusy(false)
  }

  function open(next: Step) {
    stopWaiting()
    setStep(next)
    // With a single scanner that is online there is nothing to ask: start now.
    if (next === 'scanner' && scanners.length === 1 && scanners[0].online && online) {
      start(scanners[0].scanner.scanner_id)
    }
  }

  let body
  if (linked) {
    body = (
      <div role="status" className="flex flex-col items-center gap-3 rounded-xl border border-line bg-card p-6 text-center">
        <Icon icon={CircleCheck} size={64} className="text-success" />
        <h2 className="text-xl font-bold">Card linked to {member.full_name}</h2>
        <p className="text-sm text-ink-muted">Going back to the profile…</p>
        <ButtonLink to={profile} replace>
          Back to profile
        </ButtonLink>
      </div>
    )
  } else if (card) {
    // Replace card: the old one is disabled before a new one is linked.
    body = (
      <div className="flex flex-col gap-3 rounded-xl border border-warning bg-card p-5">
        <h2 className="text-lg font-bold">Mark the old card as lost?</h2>
        <p className="text-sm">
          Card {card.card_number ?? 'without a number'} will stop working at once. Then you can link
          the new card.
        </p>
        <Button onClick={() => markCardsLost(member.member_id)} disabled={!online}>
          Mark as lost and continue
        </Button>
        <ButtonLink variant="secondary" to={profile}>
          Keep the old card
        </ButtonLink>
        {!online && <p className="text-sm text-ink-muted">Reconnect to the internet to continue.</p>}
      </div>
    )
  } else if (step === 'choose') {
    body = (
      <ul className="flex flex-col gap-3">
        {METHODS.map((m) => (
          <li key={m.step}>
            <button
              type="button"
              onClick={() => open(m.step)}
              className="flex w-full items-center gap-4 rounded-xl border border-line bg-card p-4 text-left hover:border-primary"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
                <Icon icon={m.icon} size={24} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">
                  {m.title}
                  {'recommended' in m && (
                    <span className="font-normal text-ink-muted"> (recommended)</span>
                  )}
                </span>
                <span className="block text-sm text-ink-muted">{m.text}</span>
              </span>
              <Icon icon={ChevronRight} className="shrink-0 text-ink-muted" />
            </button>
          </li>
        ))}
      </ul>
    )
  } else if (step === 'scanner') {
    body = (
      <ScannerLink
        member={member}
        scanners={scanners}
        scannerId={scannerId}
        onScanner={(next) => {
          setPicked(next)
          setBusy(false)
        }}
        request={request}
        busy={busy}
        onStart={() => start()}
        onCancel={() => open('choose')}
        onOtherMethod={open}
      />
    )
  } else if (step === 'recent') {
    body = <RecentTapsLink memberId={member.member_id} onLinked={() => setLinkedByHand(true)} />
  } else {
    body = <CardNumberLink memberId={member.member_id} onLinked={() => setLinkedByHand(true)} />
  }

  const inStep = !linked && !card && step !== 'choose'

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <button
        type="button"
        onClick={() => (inStep ? open('choose') : navigate(profile))}
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary"
      >
        <Icon icon={ArrowLeft} size={18} />
        {inStep ? 'Choose another method' : 'Profile'}
      </button>
      <header className="flex items-center gap-3">
        <MemberPhoto member={member} />
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {METHODS.find((m) => inStep && m.step === step)?.title ?? 'Link card'}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <Icon icon={CreditCard} size={16} />
            {member.full_name}
          </p>
        </div>
      </header>
      {body}
    </div>
  )
}
