import { Route, Routes } from 'react-router'
import AppShell from './layouts/AppShell'
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

      {/* Everything else sits inside the sidebar / bottom tab frame. */}
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
    </Routes>
  )
}
