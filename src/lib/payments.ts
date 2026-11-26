import type { PaymentMethod } from '../types'

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
  other: 'Other',
}

// The choices staff can pick when recording money.
export const PAYMENT_CHOICES: PaymentMethod[] = ['cash', 'gcash', 'maya']

export interface PaymentInput {
  method: PaymentMethod
  referenceNo: string
}

export const NEW_PAYMENT: PaymentInput = { method: 'cash', referenceNo: '' }

export function needsReference(method: PaymentMethod): boolean {
  return method === 'gcash' || method === 'maya'
}

export function referenceError(payment: PaymentInput): string | null {
  return needsReference(payment.method) && !payment.referenceNo.trim()
    ? 'Enter the reference number.'
    : null
}

// The reference is only saved for e-wallet payments.
export function savedReference(payment: PaymentInput): string | null {
  return needsReference(payment.method) ? payment.referenceNo.trim() : null
}

// "1,000" or "99.50" -> centavos. null if it is not a positive amount.
export function parsePesos(text: string): number | null {
  const clean = text.replace(/[₱,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null
  const centavos = Math.round(Number(clean) * 100)
  return centavos > 0 ? centavos : null
}
