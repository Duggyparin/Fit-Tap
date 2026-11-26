import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useStaff } from '../lib/data'
import { accountLook } from '../lib/status'

export default function StaffPage() {
  const users = useStaff().data

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader title="Staff" subtitle="Who can sign in. Adding accounts comes later." />
      <ul className="divide-y divide-line rounded-xl border border-line bg-card">
        {users.map((user) => (
          <li key={user.user_id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className="font-semibold">{user.display_name}</p>
              <p className="text-sm break-all text-ink-muted">{user.email}</p>
              <p className="text-sm font-medium capitalize">{user.role}</p>
            </div>
            <StatusBadge {...accountLook(user.is_active)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
