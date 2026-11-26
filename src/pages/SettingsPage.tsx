import { CircleCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import Button from '../components/Button'
import Field from '../components/Field'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { EXPIRING_DAYS } from '../lib/constants'
import { saveSettings, useIsOwner, useGym, useSettings } from '../lib/data'
import { parsePesos } from '../lib/payments'
import { useOnline } from '../lib/useOnline'

export default function SettingsPage() {
  const gym = useGym().data
  const settings = useSettings().data
  const isOwner = useIsOwner()
  const online = useOnline()

  const [gymName, setGymName] = useState(gym.gym_name)
  const [price, setPrice] = useState(String(settings.walkInCentavos / 100))
  const [saved, setSaved] = useState(false)
  const [tried, setTried] = useState(false)

  const walkInCentavos = parsePesos(price)
  const errors = {
    gymName: !gymName.trim() ? 'Enter the gym’s name.' : null,
    price: walkInCentavos === null ? 'Enter a price above zero.' : null,
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online || !isOwner) return
    if (errors.gymName || errors.price) return setTried(true)
    saveSettings({ gymName, walkInCentavos: walkInCentavos! })
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
          error={tried ? errors.gymName : null}
          disabled={!isOwner}
        />
        <Field
          label="Walk-in default price"
          prefix="₱"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={tried ? errors.price : null}
          disabled={!isOwner}
        />
        <Field
          label="Expiring soon (days)"
          value={EXPIRING_DAYS}
          readOnly
          hint="Fixed for now. A later version will let each gym change it."
        />
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
    </div>
  )
}
