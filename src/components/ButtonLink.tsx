import type { LucideIcon } from 'lucide-react'
import { Link, type LinkProps } from 'react-router'
import { buttonClasses, type ButtonVariant } from '../lib/buttonStyles'
import { useViewingGym } from '../lib/data'
import Icon from './Icon'

// A link that looks like a button: use it when clicking goes to another page.
export default function ButtonLink({
  variant = 'primary',
  icon,
  className,
  children,
  ...props
}: LinkProps & {
  variant?: ButtonVariant
  icon?: LucideIcon
}) {
  // In the read-only view, show the button but make it do nothing.
  if (useViewingGym()) {
    return (
      <button type="button" disabled className={buttonClasses(variant, className)}>
        {icon && <Icon icon={icon} size={18} />}
        {children}
      </button>
    )
  }

  return (
    <Link className={buttonClasses(variant, className)} {...props}>
      {icon && <Icon icon={icon} size={18} />}
      {children}
    </Link>
  )
}
