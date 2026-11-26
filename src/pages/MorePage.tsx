import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import Icon from '../components/Icon'
import { MORE_ITEMS } from '../components/nav/navItems'
import PagePlaceholder from '../components/PagePlaceholder'

// The phone reaches the remaining pages from here, so the links work already.
export default function MorePage() {
  return (
    <PagePlaceholder title="More">
      <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-card">
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
    </PagePlaceholder>
  )
}
