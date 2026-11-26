import { History } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'
import SelectField from '../../components/SelectField'
import { useAdminGyms, useAuditLog } from '../../lib/adminData'
import { ACTION_LABEL } from '../../lib/platform'
import { formatDate, formatTime } from '../../lib/format'

export default function AdminAuditPage() {
  const log = useAuditLog().data
  const gyms = useAdminGyms().data
  const [gym, setGym] = useState('all')
  const [action, setAction] = useState('all')
  const shown = log.filter(
    (e) => (gym === 'all' || e.gym_id === gym) && (action === 'all' || e.action === action),
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader title="Audit log" subtitle={`${shown.length} of ${log.length} actions`} />
      <div className="grid gap-3 lg:grid-cols-2">
        <SelectField
          label="Gym"
          value={gym}
          onChange={(e) => setGym(e.target.value)}
          options={[
            { value: 'all', label: 'All gyms' },
            ...gyms.map((g) => ({ value: g.gym.gym_id, label: g.gym.gym_name })),
          ]}
        />
        <SelectField
          label="Action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          options={[
            { value: 'all', label: 'All actions' },
            ...Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={History} title="No matching actions" text="Try another filter." />
      ) : (
        <ol className="divide-y divide-line rounded-xl border border-line bg-card">
          {shown.map((e) => (
            <li key={e.audit_id} className="p-4">
              <p className="font-semibold">{ACTION_LABEL[e.action]}</p>
              <p className="text-sm break-words">{e.detail}</p>
              <p className="text-sm text-ink-muted">
                {e.actor} · {e.gymName} · {formatDate(e.created_at)}, {formatTime(e.created_at)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
