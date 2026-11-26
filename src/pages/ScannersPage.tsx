import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { setDefaultScanner, useCurrentUser, useScanners } from '../lib/data'
import { formatAgo } from '../lib/format'
import { scannerLook } from '../lib/status'
import { useNow } from '../lib/useNow'
import { useOnline } from '../lib/useOnline'

export default function ScannersPage() {
  // A fixed order, so rows do not jump when the default changes.
  const scanners = [...useScanners().data].sort((a, b) =>
    a.scanner.scanner_id.localeCompare(b.scanner.scanner_id),
  )
  const isOwner = useCurrentUser().data.role === 'owner'
  const online = useOnline()
  const now = useNow(30_000)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader title="Scanners" subtitle="The default scanner is used when linking cards" />
      <fieldset disabled={!isOwner || !online}>
        <legend className="sr-only">Default scanner</legend>
        <ul className="flex flex-col gap-3">
          {scanners.map(({ scanner, online: up }) => (
            <li key={scanner.scanner_id} className="rounded-xl border border-line bg-card">
              <div className="flex items-center justify-between gap-3 p-4">
                <p className="font-semibold">{scanner.scanner_name}</p>
                <StatusBadge {...scannerLook(up)} />
              </div>
              <dl className="grid grid-cols-2 gap-3 px-4 pb-3 text-sm">
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
              <label className="flex min-h-12 cursor-pointer items-center gap-3 border-t border-line px-4 text-sm font-medium has-disabled:cursor-not-allowed">
                <input
                  type="radio"
                  name="default-scanner"
                  className="size-5 accent-primary"
                  checked={scanner.is_default}
                  disabled={scanner.status !== 'active'}
                  onChange={() => setDefaultScanner(scanner.scanner_id)}
                />
                {scanner.is_default ? 'Default scanner' : 'Make default'}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  )
}
