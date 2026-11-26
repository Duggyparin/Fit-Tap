import { ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import DevRoleSwitch from '../components/DevRoleSwitch'
import Icon from '../components/Icon'
import { ADMIN_SIDEBAR_ITEMS, ADMIN_TAB_ITEMS, adminActiveTab } from '../components/nav/adminNav'
import BottomNav from '../components/nav/BottomNav'
import Sidebar from '../components/nav/Sidebar'
import OfflineBanner from '../components/OfflineBanner'
import { useCurrentUser } from '../lib/data'

// The platform admin's frame. The navy "FitTap Admin" header on every screen
// makes it impossible to mistake for a gym's view.
export default function AdminShell() {
  const { pathname } = useLocation()
  const user = useCurrentUser().data
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar
        title="FitTap Admin"
        subtitle="Platform"
        icon={ShieldCheck}
        items={ADMIN_SIDEBAR_ITEMS}
        home="/admin"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-10">
          {import.meta.env.DEV && <DevRoleSwitch />}
          <header className="flex min-h-14 items-center justify-between gap-3 bg-navy px-4 text-card lg:px-8">
            <p className="flex items-center gap-2 font-bold">
              <Icon icon={ShieldCheck} />
              FitTap Admin
            </p>
            <p className="truncate text-sm text-card/70">{user.display_name}</p>
          </header>
          <OfflineBanner />
        </div>
        <main className="flex-1 px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pt-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav items={ADMIN_TAB_ITEMS} active={adminActiveTab(pathname)} />
    </div>
  )
}
