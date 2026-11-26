import { useOnline } from '../lib/useOnline'
import Button from './Button'
import Modal from './Modal'

// "Are you sure?" before an action that is hard to undo.
export default function ConfirmDialog({
  title,
  message,
  confirmText,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmText: string
  onConfirm: () => void
  onClose: () => void
}) {
  const online = useOnline()
  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p>{message}</p>
        <Button onClick={onConfirm} disabled={!online}>
          {confirmText}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
