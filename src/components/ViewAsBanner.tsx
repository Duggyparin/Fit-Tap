import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { Gym } from '../types'
import Button from './Button'
import Icon from './Icon'

// Shown on every screen while the platform admin looks at a gym.
export default function ViewAsBanner({ gym }: { gym: Gym }) {
  const navigate = useNavigate()
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-y border-warning bg-card px-4 py-2 text-sm font-semibold"
    >
      <Icon icon={Eye} className="text-warning" />
      Viewing as {gym.gym_name} - read only
      <Button
        variant="secondary"
        // Arriving in the admin area ends the view (see AdminShell).
        onClick={() => navigate(`/admin/gyms/${gym.gym_id}`)}
      >
        Exit
      </Button>
    </div>
  )
}
