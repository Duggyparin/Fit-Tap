import { Nfc } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import Button from '../components/Button'
import Field from '../components/Field'
import Icon from '../components/Icon'
import OfflineBanner from '../components/OfflineBanner'
import { useOnline } from '../lib/useOnline'

// Mock login: there is no real sign-in yet (Supabase Auth comes later). The
// password is never stored or sent anywhere.
export default function LoginPage() {
  const navigate = useNavigate()
  const online = useOnline()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tried, setTried] = useState(false)
  const errors = {
    email: !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter your email address.' : null,
    password: !password ? 'Enter your password.' : null,
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    if (errors.email || errors.password) return setTried(true)
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <OfflineBanner />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-navy text-card">
            <Icon icon={Nfc} size={36} />
          </span>
          <h1 className="mt-3 text-3xl font-bold text-navy">FitTap</h1>
          <p className="text-sm text-ink-muted">Gym check-in and membership in one tap.</p>
        </div>
        <form
          onSubmit={submit}
          noValidate
          className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line bg-card p-5"
        >
          <Field
            label="Email address"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={tried ? errors.email : null}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={tried ? errors.password : null}
          />
          <Button type="submit" disabled={!online}>
            Log in
          </Button>
          <p className="text-center text-sm text-ink-muted">
            Demo version: any email and password will work.
          </p>
        </form>
      </main>
    </div>
  )
}
