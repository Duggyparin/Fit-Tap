import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import Icon from '../Icon'
import { LOG_OUT_ITEM, type NavItem } from './navItems'

// Desktop only (lg and up). Used by the gym and the admin layouts.
export default function Sidebar({
  title,
  subtitle,
  icon,
  items,
  home,
  extra,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
  items: NavItem[]
  home: string // only highlighted on exactly this address
  extra?: ReactNode // shown above "Log out"
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-navy px-3 py-5 text-card lg:flex">
      <div className="flex items-center gap-3 px-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card/10">
          <Icon icon={icon} />
        </span>
        <div className="min-w-0">
          <p className="text-lg leading-tight font-bold">{title}</p>
          <p className="truncate text-xs text-card/70" title={subtitle}>
            {subtitle}
          </p>
        </div>
      </div>

      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === home}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                    isActive
                      ? 'bg-primary text-card'
                      : 'text-card/70 hover:bg-card/10 hover:text-card'
                  }`
                }
              >
                <Icon icon={item.icon} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        {extra}
        <Link
          to={LOG_OUT_ITEM.to}
          className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium text-card/70 hover:bg-card/10 hover:text-card"
        >
          <Icon icon={LOG_OUT_ITEM.icon} />
          {LOG_OUT_ITEM.label}
        </Link>
      </div>
    </aside>
  )
}
