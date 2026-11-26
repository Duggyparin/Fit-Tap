import type { BillingCycle } from '../types'

export interface Billing {
  cycle: BillingCycle
  discount: string // percent, only used for annual prepay
}

export function discountError({ cycle, discount }: Billing): string | null {
  if (cycle !== 'annual') return null
  return /^\d{1,2}$/.test(discount.trim()) && Number(discount) <= 50
    ? null
    : 'Enter a whole number from 0 to 50.'
}
