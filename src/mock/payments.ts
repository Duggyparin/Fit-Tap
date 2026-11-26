import type { Payment, PaymentMethod } from '../types'
import { OWNER_ID, STAFF_ID } from './appUsers'
import { mockId } from './helpers'
import { memberships } from './memberships'
import { plans } from './plans'

// One payment per membership, for the plan's full price, paid on the start
// date. The method rotates so the reports show a mix.
const methods: PaymentMethod[] = ['cash', 'gcash', 'cash', 'maya']

export const payments: Payment[] = memberships.map((m, i) => {
  const plan = plans.find((p) => p.plan_id === m.plan_id)!
  const method = methods[i % methods.length]
  return {
    payment_id: mockId(400 + i),
    membership_id: m.membership_id,
    amount_centavos: plan.price_centavos,
    method,
    reference_no: method === 'cash' ? null : `REF${String(784512 + i * 137)}`,
    paid_at: `${m.start_date}T02:30:00.000Z`,
    recorded_by: i % 2 === 0 ? OWNER_ID : STAFF_ID,
  }
})
