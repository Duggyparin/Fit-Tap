import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonVariant } from '../lib/buttonStyles'
import Icon from './Icon'

export default function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  icon?: LucideIcon
}) {
  return (
    <button type="button" className={buttonClasses(variant, className)} {...props}>
      {icon && <Icon icon={icon} size={18} />}
      {children}
    </button>
  )
}
