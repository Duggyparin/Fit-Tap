import { Search } from 'lucide-react'
import { appUsers, OWNER_ID } from '../../mock'
import Icon from '../Icon'

// Desktop only (lg and up). The search box does not search yet.
export default function TopBar() {
  // Mock signed-in user until login exists.
  const user = appUsers.find((u) => u.user_id === OWNER_ID)!
  const initials = user.display_name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="sticky top-0 z-10 hidden items-center justify-between gap-6 border-b border-line bg-card px-8 py-3 lg:flex">
      <label className="flex min-h-11 w-full max-w-md items-center gap-2 rounded-lg border border-line bg-page px-3 text-ink-muted focus-within:border-primary">
        <Icon icon={Search} size={18} />
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search members by name, phone, or card number"
          className="w-full bg-transparent text-sm text-ink outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-navy text-sm font-semibold text-card">
          {initials}
        </span>
        <div className="text-sm leading-tight">
          <p className="font-semibold">{user.display_name}</p>
          <p className="text-ink-muted capitalize">{user.role}</p>
        </div>
      </div>
    </header>
  )
}
