import { ChevronRight, LogOut } from 'lucide-react'
import { Link } from 'react-router'
import Icon from '../components/Icon'
import { LOG_OUT_ITEM, MORE_ITEMS } from '../components/nav/navItems'
import PageHeader from '../components/PageHeader'
import { useCurrentUser, useGym } from '../lib/data'

export default function MorePage() {
  const gym = useGym().data
  const user = useCurrentUser().data

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <PageHeader title="More" subtitle={`${gym.gym_name} · ${user.display_name} (${user.role})`} />
      <ul className="divide-y divide-line rounded-xl border border-line bg-card">
        {MORE_ITEMS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="flex min-h-14 items-center gap-3 px-4">
              <Icon icon={item.icon} className="text-ink-muted" />
              <span className="flex-1 font-medium">{item.label}</span>
              <Icon icon={ChevronRight} size={18} className="text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to={LOG_OUT_ITEM.to}
        className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-card px-4 font-medium"
      >
        <Icon icon={LogOut} className="text-ink-muted" />
        {LOG_OUT_ITEM.label}
      </Link>
    </div>
  )
}
