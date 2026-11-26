import { Link, useLocation } from 'react-router'
import Icon from '../Icon'
import { MORE_ITEMS, TAB_ITEMS } from './navItems'

// Which tab to highlight for the current address.
function activeTab(pathname: string): string | undefined {
  // On a phone the home page ("/") shows Check-ins.
  if (pathname === '/') return '/checkins'
  const inSection = (to: string) => pathname === to || pathname.startsWith(`${to}/`)
  // Pages opened from the More screen keep "More" highlighted.
  if (MORE_ITEMS.some((item) => inSection(item.to))) return '/more'
  return TAB_ITEMS.find((item) => inSection(item.to))?.to
}

// Phone and tablet only (below lg).
export default function BottomNav() {
  const active = activeTab(useLocation().pathname)

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {TAB_ITEMS.map((item) => {
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
