import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import AddGymDialog from '../../components/admin/AddGymDialog'
import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { useAdminGyms } from '../../lib/adminData'
import { formatDate } from '../../lib/format'
import { GYM_STATUS, SUBSCRIPTION_STATUS } from '../../lib/status'

export default function AdminGymsPage() {
  const gyms = useAdminGyms().data
  const [adding, setAdding] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <PageHeader
        title="Gyms"
        subtitle={`${gyms.length} gyms`}
        action={
          <Button icon={Plus} onClick={() => setAdding(true)}>
            Add gym
          </Button>
        }
      />
      <ul className="flex flex-col gap-3">
        {gyms.map((g) => (
          <li key={g.gym.gym_id}>
            <Link
              to={`/admin/gyms/${g.gym.gym_id}`}
              className="grid gap-2 rounded-xl border border-line bg-card p-4 hover:border-primary lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-center lg:gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold">{g.gym.gym_name}</p>
                <p className="text-sm text-ink-muted">
                  {g.gym.city} · {g.owner?.display_name ?? 'No owner yet'}
                </p>
              </div>
              <p className="text-sm">
                {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
              </p>
              <p className="text-sm text-ink-muted">
                {g.lastActivity ? `Last activity ${formatDate(g.lastActivity)}` : 'No activity yet'}
              </p>
              <div className="flex flex-wrap gap-2 lg:w-64 lg:justify-end">
                <StatusBadge {...GYM_STATUS[g.gym.status]} />
                <StatusBadge {...SUBSCRIPTION_STATUS[g.subscription]} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {adding && <AddGymDialog onClose={() => setAdding(false)} />}
    </div>
  )
}
