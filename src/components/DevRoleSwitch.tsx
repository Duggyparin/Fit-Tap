import { useNavigate } from 'react-router'
import { switchUser } from '../lib/adminData'
import { useCurrentUser } from '../lib/data'

// Development only: test the app as a gym owner or as the platform admin.
// Render it only behind import.meta.env.DEV.
export default function DevRoleSwitch() {
  const role = useCurrentUser().data.role
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-b border-dashed border-warning bg-card px-3 py-1 text-xs">
      <span className="text-ink-muted">Testing as</span>
      {(
        [
          ['owner', 'Gym owner', '/'],
          ['platform_admin', 'Platform admin', '/admin'],
        ] as const
      ).map(([value, label, home]) => (
        <button
          key={value}
          type="button"
          aria-pressed={role === value}
          onClick={() => {
            switchUser(value)
            navigate(home)
          }}
          className={`min-h-8 rounded-full border px-3 font-semibold ${
            role === value ? 'border-primary bg-primary text-card' : 'border-line bg-card'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
