import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { addGym, emailTaken } from '../../lib/adminData'
import { parsePesos } from '../../lib/payments'
import { useOnline } from '../../lib/useOnline'
import Button from '../Button'
import Field from '../Field'
import Modal from '../Modal'

export default function AddGymDialog({ onClose }: { onClose: () => void }) {
  const online = useOnline()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [fee, setFee] = useState('1500')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [tried, setTried] = useState(false)

  const feeCentavos = parsePesos(fee)
  const errors = {
    name: !name.trim() ? 'Enter the gym’s name.' : null,
    city: !city.trim() ? 'Enter the city or town.' : null,
    fee: feeCentavos === null ? 'Enter a fee above zero.' : null,
    ownerName: !ownerName.trim() ? 'Enter the owner’s name.' : null,
    ownerEmail: !/^\S+@\S+\.\S+$/.test(ownerEmail.trim())
      ? 'Check the email address.'
      : emailTaken(ownerEmail)
        ? 'An account already uses this email.'
        : null,
  }
  const show = (error: string | null) => (tried ? error : null)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (Object.values(errors).some(Boolean)) return setTried(true)
    const id = addGym({ name, city, feeCentavos: feeCentavos!, ownerName, ownerEmail })
    navigate(`/admin/gyms/${id}`)
  }

  return (
    <Modal title="Add gym" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Gym name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} error={show(errors.name)} />
        <Field label="City or town" value={city} onChange={(e) => setCity(e.target.value)} error={show(errors.city)} />
        <Field label="Monthly fee" prefix="₱" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} error={show(errors.fee)} />
        <Field label="Owner name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} error={show(errors.ownerName)} />
        <Field label="Owner email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} error={show(errors.ownerEmail)} />
        <p className="text-sm text-ink-muted">
          The gym starts on trial and the owner gets an invite (not really sent in this demo).
        </p>
        <Button type="submit" disabled={!online}>
          Add gym and invite owner
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </form>
    </Modal>
  )
}
