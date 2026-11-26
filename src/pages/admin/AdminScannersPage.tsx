import { Ban, KeyRound, Plus, Star } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import TokenDialog from '../../components/admin/TokenDialog'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import Field from '../../components/Field'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import SelectField from '../../components/SelectField'
import StatusBadge from '../../components/StatusBadge'
import {
  registerScanner,
  revokeScanner,
  rotateToken,
  setGymDefaultScanner,
  useAdminGyms,
  useAdminScanners,
  type AdminScanner,
} from '../../lib/adminData'
import { formatAgo } from '../../lib/format'
import { HARDWARE_STATUS, scannerStatusLook } from '../../lib/status'
import { useNow } from '../../lib/useNow'
import { useOnline } from '../../lib/useOnline'

type Open =
  | { kind: 'register' }
  | { kind: 'rotate' | 'revoke'; item: AdminScanner }
  | { kind: 'token'; name: string; token: string }
  | null

export default function AdminScannersPage() {
  const scanners = useAdminScanners().data
  const online = useOnline()
  const now = useNow(30_000)
  const [open, setOpen] = useState<Open>(null)
  const close = () => setOpen(null)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <PageHeader
        title="Scanners"
        subtitle={`${scanners.length} scanners across all gyms`}
        action={
          <Button icon={Plus} onClick={() => setOpen({ kind: 'register' })}>
            Register scanner
          </Button>
        }
      />
      <ul className="grid gap-3 lg:grid-cols-2">
        {scanners.map((item) => {
          const { scanner, gymName } = item
          const usable =
            scanner.gym_id !== null &&
            scanner.status === 'active' &&
            scanner.hardware_status === 'at_gym'
          return (
            <li key={scanner.scanner_id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{scanner.scanner_name}</p>
                  <p className="text-sm text-ink-muted">{gymName ?? 'Not at a gym'}</p>
                </div>
                <StatusBadge {...scannerStatusLook(scanner.status, item.online)} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-ink-muted">Last seen</dt>
                  <dd className="font-medium">
                    {scanner.last_seen_at ? formatAgo(scanner.last_seen_at, now) : 'Never'}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Firmware</dt>
                  <dd className="font-medium">{scanner.firmware_version ?? 'Unknown'}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge {...HARDWARE_STATUS[scanner.hardware_status]} />
                {scanner.is_default && (
                  <span className="text-sm font-semibold">Default scanner</span>
                )}
              </div>
              {scanner.gym_id !== null && scanner.status === 'active' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {usable && !scanner.is_default && (
                    <Button
                      variant="secondary"
                      icon={Star}
                      disabled={!online}
                      onClick={() => setGymDefaultScanner(scanner.scanner_id)}
                    >
                      Make default
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    icon={KeyRound}
                    onClick={() => setOpen({ kind: 'rotate', item })}
                  >
                    Rotate token
                  </Button>
                  <Button
                    variant="secondary"
                    icon={Ban}
                    onClick={() => setOpen({ kind: 'revoke', item })}
                  >
                    Revoke
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {open?.kind === 'register' && (
        <RegisterDialog
          onClose={close}
          onDone={(name, token) => setOpen({ kind: 'token', name, token })}
        />
      )}
      {open?.kind === 'rotate' && (
        <ConfirmDialog
          title="Rotate token?"
          message={`The old token of “${open.item.scanner.scanner_name}” stops working at once. The scanner stays offline until you put the new token on it.`}
          confirmText="Rotate token"
          onClose={close}
          onConfirm={() => {
            const token = rotateToken(open.item.scanner.scanner_id)
            if (token) {
              setOpen({ kind: 'token', name: open.item.scanner.scanner_name, token })
            } else close()
          }}
        />
      )}
      {open?.kind === 'revoke' && (
        <ConfirmDialog
          title="Revoke scanner?"
          message={`“${open.item.scanner.scanner_name}” at ${open.item.gymName} will be disabled and its token refused.`}
          confirmText="Revoke scanner"
          onClose={close}
          onConfirm={() => {
            revokeScanner(open.item.scanner.scanner_id)
            close()
          }}
        />
      )}
      {open?.kind === 'token' && (
        <TokenDialog scannerName={open.name} token={open.token} onClose={close} />
      )}
    </div>
  )
}

function RegisterDialog({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: (name: string, token: string) => void
}) {
  const online = useOnline()
  const gyms = useAdminGyms().data
  const [gymId, setGymId] = useState(gyms[0].gym.gym_id)
  const [name, setName] = useState('')
  const [tried, setTried] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (!name.trim()) return setTried(true)
    onDone(name.trim(), registerScanner(gymId, name))
  }

  return (
    <Modal title="Register scanner" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <SelectField
          label="Gym"
          value={gymId}
          onChange={(e) => setGymId(e.target.value)}
          options={gyms.map((g) => ({ value: g.gym.gym_id, label: g.gym.gym_name }))}
        />
        <Field
          label="Scanner name"
          placeholder="Front door"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={tried && !name.trim() ? 'Name the scanner.' : null}
        />
        <Button type="submit" disabled={!online}>
          Register and show token
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </form>
    </Modal>
  )
}
