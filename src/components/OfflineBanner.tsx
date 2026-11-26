import { WifiOff } from 'lucide-react'
import { useOnline } from '../lib/useOnline'
import Icon from './Icon'

export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning bg-card px-4 py-2 text-sm font-medium text-ink"
    >
      <Icon icon={WifiOff} size={18} className="text-warning" />
      No internet: changes will not be saved.
    </div>
  )
}
