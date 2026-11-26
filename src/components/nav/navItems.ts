import {
  ChartColumn,
  DoorOpen,
  Ellipsis,
  LayoutDashboard,
  LogOut,
  Nfc,
  Package,
  RefreshCw,
  ScanLine,
  Settings,
  Tags,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

// Every menu entry is defined once here, so the phone and desktop menus use the
// same words and icons.
const dashboard: NavItem = { label: 'Dashboard', to: '/', icon: LayoutDashboard }
const checkins: NavItem = { label: 'Check-ins', to: '/checkins', icon: Nfc }
const members: NavItem = { label: 'Members', to: '/members', icon: Users }
const renew: NavItem = { label: 'Renew', to: '/renew', icon: RefreshCw }
const walkIn: NavItem = { label: 'Walk-in', to: '/walk-in', icon: DoorOpen }
const reports: NavItem = { label: 'Reports', to: '/reports', icon: ChartColumn }
const plans: NavItem = { label: 'Plans', to: '/plans', icon: Tags }
const scanners: NavItem = { label: 'Scanners', to: '/scanners', icon: ScanLine }
const cardOrders: NavItem = { label: 'Card orders', to: '/card-orders', icon: Package }
const staff: NavItem = { label: 'Staff', to: '/staff', icon: UserCog }
const settings: NavItem = { label: 'Settings', to: '/settings', icon: Settings }
const more: NavItem = { label: 'More', to: '/more', icon: Ellipsis }

// Shown under the menu (desktop) and on the More screen (phone).
export const LOG_OUT_ITEM: NavItem = { label: 'Log out', to: '/login', icon: LogOut }

// Desktop sidebar, top to bottom.
export const SIDEBAR_ITEMS: NavItem[] = [
  dashboard,
  checkins,
  members,
  renew,
  walkIn,
  reports,
  plans,
  scanners,
  cardOrders,
  staff,
  settings,
]

// Phone bottom bar.
export const TAB_ITEMS: NavItem[] = [checkins, members, renew, walkIn, more]

// The pages listed on the phone's More screen.
export const MORE_ITEMS: NavItem[] = [reports, plans, scanners, cardOrders, staff, settings]
