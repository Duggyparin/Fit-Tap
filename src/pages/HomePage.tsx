import { DESKTOP_QUERY, useMediaQuery } from '../lib/useMediaQuery'
import CheckinsPage from './CheckinsPage'
import DashboardPage from './DashboardPage'

// "/" is the Dashboard on desktop and the Check-ins feed on a phone.
export default function HomePage() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  return isDesktop ? <DashboardPage /> : <CheckinsPage />
}
