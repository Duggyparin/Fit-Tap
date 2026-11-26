import type { MembershipState } from '../lib/membership'
import {
  CHECKIN_STATUS,
  MEMBERSHIP_STATUS,
  SOURCE_LABEL,
  type StatusLook,
  type StatusTone,
} from '../lib/status'
import type { CheckinResult, CheckinSource } from '../types'
import Icon from './Icon'

// Full class names, so Tailwind can find them.
const TONE: Record<StatusTone, { background: string; icon: string }> = {
  success: { background: 'bg-success/10', icon: 'text-success' },
  danger: { background: 'bg-danger/10', icon: 'text-danger' },
  warning: { background: 'bg-warning/15', icon: 'text-warning' },
  muted: { background: 'bg-muted/10', icon: 'text-muted' },
}

// Always icon + label + color, so color is never the only signal. The text
// stays dark (text-ink) so it is readable on every tint.
export default function StatusBadge({ tone, icon, label }: StatusLook) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-ink ${TONE[tone].background}`}
    >
      <Icon icon={icon} size={14} className={TONE[tone].icon} />
      {label}
    </span>
  )
}

export function MembershipBadge({ state }: { state: MembershipState }) {
  return <StatusBadge {...MEMBERSHIP_STATUS[state]} />
}

// Shows e.g. "[Allowed] · Manual" or "[Allowed] · Scanner".
export function CheckinBadge({ result, source }: { result: CheckinResult; source: CheckinSource }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusBadge {...CHECKIN_STATUS[result]} />
      <span className="text-xs text-ink-muted">· {SOURCE_LABEL[source]}</span>
    </span>
  )
}
