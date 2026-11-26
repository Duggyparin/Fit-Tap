import { ArrowLeft, CreditCard } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '../components/Button'
import Field from '../components/Field'
import Icon from '../components/Icon'
import PaymentFields from '../components/PaymentFields'
import PhotoCapture from '../components/PhotoCapture'
import PlanPicker from '../components/PlanPicker'
import { registerMember, useMembers, usePlans } from '../lib/data'
import { formatDate, formatPeso, todayInManila } from '../lib/format'
import { formatPhoneInput, isValidPhone } from '../lib/members'
import { endDateFor } from '../lib/membership'
import { NEW_PAYMENT, referenceError } from '../lib/payments'
import { useOnline } from '../lib/useOnline'

const SECTION = 'flex flex-col gap-4'

export default function RegisterMemberPage() {
  const navigate = useNavigate()
  const online = useOnline()
  const plans = usePlans().data
  const members = useMembers().data
  const form = useRef<HTMLFormElement>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [planId, setPlanId] = useState(
    () => {
      const active = plans.filter((p) => p.is_active)
      return (active.find((p) => p.duration_days === 30) ?? active[0]).plan_id
    },
  )
  const [payment, setPayment] = useState(NEW_PAYMENT)
  const [tried, setTried] = useState(false)

  const plan = plans.find((p) => p.plan_id === planId)!
  const start = todayInManila()
  const errors = {
    fullName: fullName.trim().length < 2 ? 'Enter the member’s full name.' : null,
    phone: !isValidPhone(phone) ? 'Use the format 09XX XXX XXXX.' : null,
    email:
      email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Check the email address.' : null,
    photo: !photo ? 'Take the member’s photo.' : null,
    consent: !consent ? 'The member must give consent.' : null,
    reference: referenceError(payment),
  }
  const invalid = Object.values(errors).some(Boolean)
  const show = (error: string | null) => (tried ? error : null)
  const sameNumber = isValidPhone(phone) && members.find((r) => r.member.phone === phone)

  function save(thenLinkCard: boolean) {
    if (!online) return
    if (invalid) {
      setTried(true)
      // Wait for the error messages to appear, then go to the first problem.
      requestAnimationFrame(() => {
        const first = form.current?.querySelector<HTMLElement>(
          '[aria-invalid=true], [data-invalid=true]',
        )
        first?.scrollIntoView({ block: 'center' })
        first?.focus()
      })
      return
    }
    const id = registerMember({ fullName, phone, email, photoUrl: photo!, planId, payment })
    // replace: "Back" should not return to a form that was already saved.
    navigate(thenLinkCard ? `/members/${id}/link-card` : `/members/${id}`, { replace: true })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    save(true)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Link
        to="/members"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary"
      >
        <Icon icon={ArrowLeft} size={18} />
        Members
      </Link>
      <h1 className="text-2xl font-bold text-navy">Register member</h1>

      <form ref={form} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className={SECTION}>
            <div data-invalid={show(errors.photo) ? true : undefined} tabIndex={-1}>
              <PhotoCapture value={photo} onChange={setPhoto} error={show(errors.photo)} />
            </div>
            <Field
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={show(errors.fullName)}
              placeholder="Juan Dela Cruz"
              autoComplete="off"
            />
            <Field
              label="Phone number"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              error={show(errors.phone)}
              hint={
                sameNumber
                  ? `${sameNumber.member.full_name} already uses this number.`
                  : undefined
              }
              placeholder="09XX XXX XXXX"
              autoComplete="off"
            />
            <Field
              label="Email address"
              optional
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={show(errors.email)}
              placeholder="name@example.com"
              autoComplete="off"
            />
          </div>

          <div className={SECTION}>
            <PlanPicker plans={plans} value={planId} onChange={setPlanId} />
            <PaymentFields value={payment} onChange={setPayment} error={show(errors.reference)} />

            <dl className="rounded-xl border border-line bg-card p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Starts today</dt>
                <dd className="font-medium">{formatDate(start)}</dd>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <dt className="text-ink-muted">Last day</dt>
                <dd className="font-medium">
                  {formatDate(endDateFor(start, plan.duration_days))}
                </dd>
              </div>
              <div className="mt-2 flex justify-between gap-3 border-t border-line pt-2">
                <dt className="font-semibold">Amount to collect</dt>
                <dd className="text-lg font-bold">{formatPeso(plan.price_centavos)}</dd>
              </div>
            </dl>

            <div>
              <label className="flex min-h-12 items-start gap-3 rounded-xl border border-line bg-card p-4">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={show(errors.consent) ? true : undefined}
                  className="mt-0.5 size-5 shrink-0 accent-primary"
                />
                <span className="text-sm">
                  The member agrees that the gym stores their name, contact details, photo and
                  check-in history to manage their membership. They can ask for it to be deleted.
                </span>
              </label>
              {show(errors.consent) && (
                <p className="mt-1.5 text-sm font-medium">⚠ {errors.consent}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-4 lg:flex-row lg:justify-end">
          {tried && invalid && (
            <p role="alert" className="self-center text-sm font-medium lg:mr-auto">
              Please fix the marked fields.
            </p>
          )}
          {!online && (
            <p className="self-center text-sm text-ink-muted">Reconnect to the internet to save.</p>
          )}
          <Button variant="secondary" onClick={() => save(false)} disabled={!online}>
            Save without card
          </Button>
          <Button type="submit" icon={CreditCard} disabled={!online}>
            Save and link card
          </Button>
        </div>
      </form>
    </div>
  )
}
