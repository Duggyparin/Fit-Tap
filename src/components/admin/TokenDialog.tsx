import { Copy, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import Button from '../Button'
import Icon from '../Icon'
import Modal from '../Modal'

// Shows a new scanner token exactly once. Closing the dialog forgets it.
export default function TokenDialog({
  scannerName,
  token,
  onClose,
}: {
  scannerName: string
  token: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState<'yes' | 'no' | null>(null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(token)
      setCopied('yes')
    } catch {
      setCopied('no') // clipboard needs HTTPS or localhost
    }
  }

  return (
    <Modal title="Scanner token" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 rounded-xl border border-warning bg-card p-4 text-sm font-semibold">
          <Icon icon={TriangleAlert} className="shrink-0 text-warning" />
          Copy this now. It is shown only once and cannot be recovered. If it is lost, rotate the
          token.
        </p>
        <p className="text-sm">
          Token for <strong>{scannerName}</strong>, for SCANNER_TOKEN in the scanner’s secrets.h:
        </p>
        <code className="rounded-lg border border-line bg-card p-3 text-sm break-all select-all">
          {token}
        </code>
        <Button icon={Copy} onClick={() => void copy()}>
          Copy token
        </Button>
        <p role="status" className="text-sm font-medium">
          {copied === 'yes' && 'Copied.'}
          {copied === 'no' && 'Could not copy. Select the text and copy it by hand.'}
        </p>
        <p className="text-sm text-ink-muted">
          Demo token: it does not work with a real scanner yet.
        </p>
        <Button variant="secondary" onClick={onClose}>
          I have saved it
        </Button>
      </div>
    </Modal>
  )
}
