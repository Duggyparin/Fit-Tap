import { CreditCard } from 'lucide-react'
import type { Member } from '../types'
import Icon from './Icon'

const SIZE = {
  sm: { box: 'size-9 text-xs', icon: 18 },
  md: { box: 'size-12 text-sm', icon: 22 },
  lg: { box: 'size-32 text-4xl', icon: 48 },
}

// "Juan Dela Cruz" -> "JD"
function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

// The member's photo, or their initials. Pass null for an unknown card.
// The photo is decorative here: the name is always written next to it.
export default function MemberPhoto({
  member,
  size = 'md',
}: {
  member: Pick<Member, 'full_name' | 'photo_url'> | null
  size?: keyof typeof SIZE
}) {
  const base = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${SIZE[size].box}`

  if (!member) {
    return (
      <span className={`${base} border border-dashed border-line bg-page text-ink-muted`}>
        <Icon icon={CreditCard} size={SIZE[size].icon} />
      </span>
    )
  }
  if (member.photo_url) {
    return <img src={member.photo_url} alt="" className={`${base} object-cover`} />
  }
  return (
    <span className={`${base} bg-navy/10 text-navy`} aria-hidden="true">
      {initials(member.full_name)}
    </span>
  )
}
