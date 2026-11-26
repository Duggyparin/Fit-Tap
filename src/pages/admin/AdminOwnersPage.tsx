import { Send, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import SelectField from '../../components/SelectField'
import StatusBadge from '../../components/StatusBadge'
import { emailTaken, inviteOwner, resendInvite, useAdminGyms, useOwners } from '../../lib/adminData'
import { formatDate } from '../../lib/format'
import { inviteLook } from '../../lib/status'
import { useOnline } from '../../lib/useOnline'

export default function AdminOwnersPage() {
  const owners = useOwners().data
  const online = useOnline()
  const [inviting, setInviting] = useState(false)
  const [resent, setResent] = useState<string | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Owners"
        subtitle="Gym owner accounts. Invites are not really sent in this demo."
        action={
          <Button icon={UserPlus} onClick={() => setInviting(true)}>
            Invite owner
          </Button>
        }
      />
      <ul className="divide-y divide-line rounded-xl border border-line bg-card">
        {owners.map((owner) => (
          <li key={owner.user_id} className="flex flex-col gap-2 p-4 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{owner.display_name}</p>
              <p className="text-sm break-all text-ink-muted">{owner.email}</p>
              <p className="text-sm">{owner.gymName}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge {...inviteLook(owner.accepted_at !== null)} />
              {!owner.accepted_at && (
                <Button
                  variant="secondary"
                  icon={Send}
                  disabled={!online}
                  onClick={() => {
                    resendInvite(owner.user_id)
                    setResent(owner.user_id)
                  }}
                >
                  Resend invite
                </Button>
              )}
            </div>
            {resent === owner.user_id && owner.invited_at && (
              <p role="status" className="text-sm font-medium">
                Invite resent on {formatDate(owner.invited_at)}.
              </p>
            )}
          </li>
        ))}
      </ul>
      {inviting && <InviteDialog onClose={() => setInviting(false)} />}
    </div>
  )
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const online = useOnline()
  const gyms = useAdminGyms().data
  const [gymId, setGymId] = useState(gyms[0].gym.gym_id)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tried, setTried] = useState(false)
  const errors = {
    name: !name.trim() ? 'Enter the owner’s name.' : null,
    email: !/^\S+@\S+\.\S+$/.test(email.trim())
      ? 'Check the email address.'
      : emailTaken(email)
        ? 'An account already uses this email.'
        : null,
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (errors.name || errors.email) return setTried(true)
    inviteOwner(gymId, name, email)
    onClose()
  }

  return (
    <Modal title="Invite owner" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <SelectField
          label="Gym"
          value={gymId}
          onChange={(e) => setGymId(e.target.value)}
          options={gyms.map((g) => ({ value: g.gym.gym_id, label: g.gym.gym_name }))}
        />
        <Field label="Owner name" value={name} onChange={(e) => setName(e.target.value)} error={tried ? errors.name : null} />
        <Field label="Owner email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={tried ? errors.email : null} />
        <Button type="submit" disabled={!online}>
          Send invite
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </form>
    </Modal>
  )
}
