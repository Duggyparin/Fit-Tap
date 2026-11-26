import { LayoutDashboard, Store, UserRound } from 'lucide-react'
import { LOG_OUT_ITEM, type NavItem } from './navItems'

const overview: NavItem = { label: 'Overview', to: '/admin', icon: LayoutDashboard }
const gyms: NavItem = { label: 'Gyms', to: '/admin/gyms', icon: Store }
const owners: NavItem = { label: 'Owners', to: '/admin/owners', icon: UserRound }

export const ADMIN_SIDEBAR_ITEMS: NavItem[] = [overview, gyms, owners]
export const ADMIN_TAB_ITEMS: NavItem[] = [overview, gyms, owners, LOG_OUT_ITEM]

export function adminActiveTab(pathname: string): string | undefined {
  if (pathname === '/admin') return '/admin'
  return ADMIN_TAB_ITEMS.slice(1).find((item) => pathname.startsWith(item.to))?.to
}
