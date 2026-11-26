import { Wand2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { registerBatch, useAdminBatches, useAdminGyms, useUsedCards } from '../../lib/adminData'
import { parseCardLines } from '../../lib/batches'
import { formatDate } from '../../lib/format'
import { useOnline } from '../../lib/useOnline'
import Button from '../Button'
import Modal from '../Modal'
import SelectField from '../SelectField'

const hex = (bytes: number) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

export default function RegisterBatchDialog({ onClose }: { onClose: () => void }) {
  const online = useOnline()
  const gyms = useAdminGyms().data
  const batches = useAdminBatches().data
  const textId = useId()
  const [gymId, setGymId] = useState(gyms[0].gym.gym_id)
  const [batchId, setBatchId] = useState('new')
  const [text, setText] = useState('')
  const [tried, setTried] = useState(false)
  const used = useUsedCards(gymId)
  const { cards, problems } = parseCardLines(text, used.uids, used.numbers)

  // Orders of this gym that still have cards to register.
  const openOrders = batches.filter(
    (b) => b.batch.gym_id === gymId && b.registered < b.batch.quantity,
  )

  function simulate() {
    const lines = Array.from(
      { length: 5 },
      () => `04${hex(6)}, ${hex(2)}-${hex(2)}`,
    )
    setText((t) => [t.trim(), ...lines].filter(Boolean).join('\n'))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (problems.length > 0 || cards.length === 0) return setTried(true)
    registerBatch(gymId, batchId === 'new' ? null : batchId, cards)
    onClose()
  }

  return (
    <Modal title="Register batch" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <SelectField
          label="Gym"
          value={gymId}
          onChange={(e) => {
            setGymId(e.target.value)
            setBatchId('new')
          }}
          options={gyms.map((g) => ({ value: g.gym.gym_id, label: g.gym.gym_name }))}
        />
        <SelectField
          label="Order"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          options={[
            { value: 'new', label: 'New batch (no earlier order)' },
            ...openOrders.map((b) => ({
              value: b.batch.batch_id,
              label: `${b.batch.quantity} cards, ${formatDate(b.batch.ordered_at)} (${b.registered} done)`,
            })),
          ]}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={textId} className="text-sm font-semibold">
            Cards, one per line: UID, printed number
          </label>
          <textarea
            id={textId}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="04A1B2C3D4E5F6, IR-0101"
            spellCheck={false}
            className="w-full rounded-lg border border-line bg-card p-3 font-mono text-base"
          />
          <p className="text-sm text-ink-muted">{cards.length} cards ready to save</p>
        </div>
        {tried && (problems.length > 0 || cards.length === 0) && (
          <ul role="alert" className="rounded-xl border border-danger bg-card p-3 text-sm">
            {(problems.length ? problems : ['Enter at least one card.']).slice(0, 5).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {/* Testing only: real UIDs come from the chips themselves. */}
        {import.meta.env.DEV && (
          <Button variant="secondary" icon={Wand2} onClick={simulate}>
            Simulate 5 cards
          </Button>
        )}
        <Button type="submit" disabled={!online}>
          Save as stock
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </form>
    </Modal>
  )
}
