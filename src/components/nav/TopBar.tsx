import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCurrentUser } from '../../lib/data'
import Icon from '../Icon'

// Desktop only (lg and up). Pressing Enter searches the Members page.
export default function TopBar() {
  const user = useCurrentUser().data
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function search(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/members?q=${encodeURIComponent(q)}` : '/members')
    setQuery('')
  }
  const initials = user.display_name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="hidden items-center justify-between gap-6 border-b border-line bg-card px-8 py-3 lg:flex">
      <form role="search" onSubmit={search} className="w-full max-w-md">
        <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-line bg-page px-3 text-ink-muted focus-within:border-primary">
          <Icon icon={Search} size={18} />
          <input
            type="search"
            aria-label="Search members"
            placeholder="Search members by name, phone, or card number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-ink outline-none"
          />
        </label>
      </form>

      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-navy text-sm font-semibold text-card">
          {initials}
        </span>
        <div className="text-sm leading-tight">
          <p className="font-semibold">{user.display_name}</p>
          <p className="text-ink-muted capitalize">{user.role}</p>
        </div>
      </div>
    </header>
  )
}
