import { useState, type FormEvent } from 'react'
import { linkCardByNumber } from '../../lib/data'
import { useOnline } from '../../lib/useOnline'
import Button from '../Button'
import Field from '../Field'

export default function CardNumberLink({
  memberId,
  onLinked,
}: {
  memberId: string
  onLinked: () => void
}) {
  const online = useOnline()
  const [number, setNumber] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!online) return
    const problem = number.trim()
      ? linkCardByNumber(memberId, number)
      : 'Enter the number printed on the card.'
    setError(problem)
    if (!problem) onLinked()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <Field
        label="Card number"
        value={number}
        onChange={(e) => {
          setNumber(e.target.value)
          setError(null)
        }}
        error={error}
        hint="The short number printed on the card, for example IR-0013."
        autoCapitalize="characters"
        autoComplete="off"
      />
      <Button type="submit" disabled={!online}>
        Link card
      </Button>
      {!online && <p className="text-sm text-ink-muted">Reconnect to the internet to link.</p>}
    </form>
  )
}
