import type { LucideIcon } from 'lucide-react'
import { Link, type LinkProps } from 'react-router'
import { buttonClasses, type ButtonVariant } from '../lib/buttonStyles'
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
  return (
    <Link className={buttonClasses(variant, className)} {...props}>
      {icon && <Icon icon={icon} size={18} />}
      {children}
    </Link>
  )
}
