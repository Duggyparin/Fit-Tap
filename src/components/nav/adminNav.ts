import {
  Ellipsis,
  History,
  LayoutDashboard,
  Package,
  ScanLine,
  Store,
  UserRound,
} from 'lucide-react'
import type { NavItem } from './navItems'

const overview: NavItem = { label: 'Overview', to: '/admin', icon: LayoutDashboard }
const gyms: NavItem = { label: 'Gyms', to: '/admin/gyms', icon: Store }
const owners: NavItem = { label: 'Owners', to: '/admin/owners', icon: UserRound }
const scanners: NavItem = { label: 'Scanners', to: '/admin/scanners', icon: ScanLine }
const orders: NavItem = { label: 'Card orders', to: '/admin/card-orders', icon: Package }
const audit: NavItem = { label: 'Audit log', to: '/admin/audit', icon: History }
const more: NavItem = { label: 'More', to: '/admin/more', icon: Ellipsis }

export const ADMIN_SIDEBAR_ITEMS: NavItem[] = [overview, gyms, owners, scanners, orders, audit]
export const ADMIN_TAB_ITEMS: NavItem[] = [
  overview,
  gyms,
  scanners,
  { ...orders, label: 'Orders' }, // shorter on the phone tab bar
  more,
]
export const ADMIN_MORE_ITEMS: NavItem[] = [owners, audit]

export function adminActiveTab(pathname: string): string | undefined {
  if (pathname === '/admin') return '/admin'
  if (ADMIN_MORE_ITEMS.some((item) => pathname.startsWith(item.to))) return more.to
  return ADMIN_TAB_ITEMS.slice(1).find((item) => pathname.startsWith(item.to))?.to
}
