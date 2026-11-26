import { MapPinOff } from 'lucide-react'
import ButtonLink from '../components/ButtonLink'
import EmptyState from '../components/EmptyState'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={MapPinOff}
      title="Page not found"
      text="There is nothing at this address."
      action={<ButtonLink to="/">Go to the home page</ButtonLink>}
    />
  )
}
