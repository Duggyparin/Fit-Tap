import { Route, Routes } from 'react-router'
import { RequireAdmin, RequireGym } from './components/RequireRole'
import AdminShell from './layouts/AdminShell'
import AppShell from './layouts/AppShell'
import AdminAuditPage from './pages/admin/AdminAuditPage'
import AdminCardOrdersPage from './pages/admin/AdminCardOrdersPage'
import AdminGymPage from './pages/admin/AdminGymPage'
import AdminGymsPage from './pages/admin/AdminGymsPage'
import AdminMorePage from './pages/admin/AdminMorePage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminOwnersPage from './pages/admin/AdminOwnersPage'
import AdminScannersPage from './pages/admin/AdminScannersPage'
import CardOrdersPage from './pages/CardOrdersPage'
import CheckinsPage from './pages/CheckinsPage'
import HomePage from './pages/HomePage'
import LinkCardPage from './pages/LinkCardPage'
import LoginPage from './pages/LoginPage'
import MemberProfilePage from './pages/MemberProfilePage'
import MembersPage from './pages/MembersPage'
import MorePage from './pages/MorePage'
import NotFoundPage from './pages/NotFoundPage'
import PlansPage from './pages/PlansPage'
import RegisterMemberPage from './pages/RegisterMemberPage'
import RenewPage from './pages/RenewPage'
import ReportsPage from './pages/ReportsPage'
import ScannersPage from './pages/ScannersPage'
import SettingsPage from './pages/SettingsPage'
import StaffPage from './pages/StaffPage'
import WalkInPage from './pages/WalkInPage'

export default function App() {
  return (
    <Routes>
      {/* Login has no navigation around it. */}
      <Route path="login" element={<LoginPage />} />

      {/* The platform admin's separate area. */}
      <Route path="admin" element={<RequireAdmin />}>
        <Route element={<AdminShell />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="gyms" element={<AdminGymsPage />} />
          <Route path="gyms/:id" element={<AdminGymPage />} />
          <Route path="owners" element={<AdminOwnersPage />} />
          <Route path="scanners" element={<AdminScannersPage />} />
          <Route path="card-orders" element={<AdminCardOrdersPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="more" element={<AdminMorePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* A gym's screens, inside the sidebar / bottom tab frame. */}
      <Route element={<RequireGym />}>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="checkins" element={<CheckinsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="members/new" element={<RegisterMemberPage />} />
          <Route path="members/:id" element={<MemberProfilePage />} />
          <Route path="members/:id/link-card" element={<LinkCardPage />} />
          <Route path="renew" element={<RenewPage />} />
          <Route path="walk-in" element={<WalkInPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="scanners" element={<ScannersPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="card-orders" element={<CardOrdersPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
