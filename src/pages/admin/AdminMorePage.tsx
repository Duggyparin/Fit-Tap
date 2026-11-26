import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import Icon from '../../components/Icon'
import { ADMIN_MORE_ITEMS } from '../../components/nav/adminNav'
import { LOG_OUT_ITEM } from '../../components/nav/navItems'
import PageHeader from '../../components/PageHeader'

export default function AdminMorePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <PageHeader title="More" />
      <ul className="divide-y divide-line rounded-xl border border-line bg-card">
        {[...ADMIN_MORE_ITEMS, LOG_OUT_ITEM].map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="flex min-h-14 items-center gap-3 px-4">
              <Icon icon={item.icon} className="text-ink-muted" />
              <span className="flex-1 font-medium">{item.label}</span>
              <Icon icon={ChevronRight} size={18} className="text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
