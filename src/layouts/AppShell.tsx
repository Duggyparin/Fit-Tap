import { Nfc } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import DevRoleSwitch from '../components/DevRoleSwitch'
import BottomNav from '../components/nav/BottomNav'
import { gymActiveTab, SIDEBAR_ITEMS, TAB_ITEMS } from '../components/nav/navItems'
import Sidebar from '../components/nav/Sidebar'
import TopBar from '../components/nav/TopBar'
import OfflineBanner from '../components/OfflineBanner'
import ViewAsBanner from '../components/ViewAsBanner'
import { useGym, useViewingGym } from '../lib/data'

// The frame around every signed-in page. Below lg: page + bottom tabs.
// From lg: navy sidebar + top bar + page.
export default function AppShell() {
  // A new page starts at the top.
  const { pathname } = useLocation()
  const gym = useGym().data
  const viewing = useViewingGym()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar
        title="FitTap"
        subtitle={gym.gym_name}
        icon={Nfc}
        items={SIDEBAR_ITEMS}
        home="/"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Stays visible while scrolling. */}
        <div className="sticky top-0 z-10">
          {import.meta.env.DEV && <DevRoleSwitch />}
          <TopBar />
          {viewing && <ViewAsBanner gym={viewing} />}
          <OfflineBanner />
        </div>
        {/* The bottom padding keeps content clear of the fixed tab bar. */}
        <main className="flex-1 px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pt-8 lg:pb-8">
          {/* Read-only view: a disabled fieldset turns off every button and
              field inside it. Links still work for moving around. */}
          {viewing ? (
            <fieldset disabled className="min-w-0">
              <Outlet />
            </fieldset>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <BottomNav items={TAB_ITEMS} active={gymActiveTab(pathname)} />
    </div>
  )
}
