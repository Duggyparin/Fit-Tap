// Shared look for <Button> and <ButtonLink>.

const VARIANT = {
  primary: 'bg-primary text-card not-disabled:hover:bg-primary-hover',
  secondary: 'border border-line bg-card text-ink not-disabled:hover:bg-page',
}

export type ButtonVariant = keyof typeof VARIANT

export function buttonClasses(variant: ButtonVariant, className = ''): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${className}`
}
