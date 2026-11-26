import { CircleCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import ActivityLog from '../components/ActivityLog'
import Button from '../components/Button'
import Field from '../components/Field'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import PrivacyNoticeDialog from '../components/PrivacyNoticeDialog'
import QrSettings from '../components/QrSettings'
import { SUPPORT_EMAIL } from '../lib/config'
import { EXPIRING_DAYS } from '../lib/constants'
import {
  saveSettings,
  useGym,
  useIsOwner,
  usePrivacyContact,
  useSettings,
  useViewingGym,
} from '../lib/data'
import { parsePesos } from '../lib/payments'
import { useOnline } from '../lib/useOnline'

export default function SettingsPage() {
  const gym = useGym().data
  const settings = useSettings().data
  const contact = usePrivacyContact().data
  const isOwner = useIsOwner()
  const readOnly = useViewingGym() !== null
  const online = useOnline()

  const [gymName, setGymName] = useState(gym.gym_name)
  const [price, setPrice] = useState(String(settings.walkInCentavos / 100))
  const [contactName, setContactName] = useState(contact.name)
  const [contactDetail, setContactDetail] = useState(contact.detail)
  const [saved, setSaved] = useState(false)
  const [tried, setTried] = useState(false)
  const [showNotice, setShowNotice] = useState(false)

  const walkInCentavos = parsePesos(price)
  const errors = {
    gymName: !gymName.trim() ? 'Enter the gym’s name.' : null,
    price: walkInCentavos === null ? 'Enter a price above zero.' : null,
    contactName: !contactName.trim() ? 'Enter who members should contact.' : null,
    contactDetail: !contactDetail.trim() ? 'Enter a phone number or email.' : null,
  }
  const show = (error: string | null) => (tried ? error : null)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online || !isOwner) return
    if (Object.values(errors).some(Boolean)) return setTried(true)
    saveSettings({
      gymName,
      walkInCentavos: walkInCentavos!,
      privacyContact: { name: contactName, detail: contactDetail },
    })
    setSaved(true)
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <PageHeader
        title="Settings"
        subtitle={isOwner ? 'Gym details and defaults' : 'Only the owner can change settings'}
      />
      <form
        onSubmit={submit}
        onChange={() => setSaved(false)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Field
          label="Gym name"
          value={gymName}
          onChange={(e) => setGymName(e.target.value)}
          error={show(errors.gymName)}
          disabled={!isOwner}
        />
        <Field
          label="Walk-in default price"
          prefix="₱"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={show(errors.price)}
          disabled={!isOwner}
        />
        <Field
          label="Expiring soon (days)"
          value={EXPIRING_DAYS}
          readOnly
          hint="Fixed for now. A later version will let each gym change it."
        />

        <h2 className="mt-2 font-bold text-navy">Privacy contact</h2>
        <p className="text-sm text-ink-muted">
          Members send data requests here. FitTap support ({SUPPORT_EMAIL}) is the backup.
        </p>
        <Field
          label="Contact name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          error={show(errors.contactName)}
          disabled={!isOwner}
        />
        <Field
          label="Contact phone or email"
          value={contactDetail}
          onChange={(e) => setContactDetail(e.target.value)}
          error={show(errors.contactDetail)}
          disabled={!isOwner}
        />
        <Button variant="secondary" onClick={() => setShowNotice(true)}>
          Preview privacy notice
        </Button>

        {isOwner && (
          <Button type="submit" disabled={!online}>
            Save settings
          </Button>
        )}
        {!online && <p className="text-sm text-ink-muted">Reconnect to the internet to save.</p>}
        <div role="status">
          {saved && (
            <p className="flex items-center gap-2 rounded-xl border border-success bg-card p-4 text-sm font-semibold">
              <Icon icon={CircleCheck} className="text-success" />
              Settings saved
            </p>
          )}
        </div>
      </form>

      {isOwner && (
        <>
          <QrSettings disabled={!online || readOnly} />
          <ActivityLog />
        </>
      )}
      {showNotice && <PrivacyNoticeDialog onClose={() => setShowNotice(false)} />}
    </div>
  )
}
