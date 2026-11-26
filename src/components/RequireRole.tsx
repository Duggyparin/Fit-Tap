import { Navigate, Outlet } from 'react-router'
import { useCurrentUser, useViewingGym } from '../lib/data'
import NotFoundPage from '../pages/NotFoundPage'

// Route guards. They only hide screens: the database (Row Level Security) must
// enforce the same rules, because browser code can be changed by the user.

// Admin pages: anyone else sees "Page not found".
export function RequireAdmin() {
  const role = useCurrentUser().data.role
  if (role === 'platform_admin') return <Outlet />
  return (
    <main className="p-4">
      <NotFoundPage />
    </main>
  )
}

// Gym pages: the admin only gets in through "View as gym".
export function RequireGym() {
  const role = useCurrentUser().data.role
  const viewing = useViewingGym()
  return role === 'platform_admin' && !viewing ? <Navigate to="/admin" replace /> : <Outlet />
}
