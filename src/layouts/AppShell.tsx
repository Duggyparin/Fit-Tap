import { Outlet } from 'react-router'
import BottomNav from '../components/nav/BottomNav'
import Sidebar from '../components/nav/Sidebar'
import TopBar from '../components/nav/TopBar'
import OfflineBanner from '../components/OfflineBanner'

// The frame around every signed-in page. Below lg: page + bottom tabs.
// From lg: navy sidebar + top bar + page.
export default function AppShell() {
  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Stays visible while scrolling. */}
        <div className="sticky top-0 z-10">
          <TopBar />
          <OfflineBanner />
        </div>
        {/* The bottom padding keeps content clear of the fixed tab bar. */}
        <main className="flex-1 px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pt-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
