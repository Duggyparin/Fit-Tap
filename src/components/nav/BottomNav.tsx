import { Link } from 'react-router'
import Icon from '../Icon'
import type { NavItem } from './navItems'

// Phone and tablet only (below lg).
export default function BottomNav({
  items,
  active,
}: {
  items: NavItem[]
  active: string | undefined // the highlighted tab's address
}) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid auto-cols-fr grid-flow-col">
        {items.map((item) => {
          const isActive = item.to === active
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
                  isActive ? 'font-semibold text-primary' : 'text-ink-muted'
                }`}
              >
                <Icon icon={item.icon} size={22} />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
