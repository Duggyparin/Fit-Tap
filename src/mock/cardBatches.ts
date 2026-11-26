import type { CardBatch } from '../types'
import { GYM_ID } from './gym'
import { daysFromToday, mockId, pesos } from './helpers'

export const BATCH_ID = mockId(41)

export const cardBatches: CardBatch[] = [
  {
    batch_id: BATCH_ID,
    gym_id: GYM_ID,
    quantity: 50,
    chip_type: 'NTAG215',
    design_url: null,
    price_centavos: pesos(2500),
    status: 'received',
    ordered_at: `${daysFromToday(-120)}T02:00:00.000Z`,
  },
]
