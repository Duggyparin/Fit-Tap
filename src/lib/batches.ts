// Card batch counting, and reading the "UID, number" lines when a batch is
// registered.

import type { CardBatch, NfcCard } from '../types'

export interface BatchCounts {
  batch: CardBatch
  registered: number // card UIDs saved for this batch
  inStock: number
  linked: number
  blocked: number // lost or disabled
}

export function countBatch(batch: CardBatch, cards: NfcCard[]): BatchCounts {
  const own = cards.filter((c) => c.batch_id === batch.batch_id)
  const count = (...status: NfcCard['status'][]) =>
    own.filter((c) => status.includes(c.status)).length
  return {
    batch,
    registered: own.length,
    inStock: count('stock'),
    linked: count('active'),
    blocked: count('lost', 'disabled'),
  }
}

export interface NewCard {
  uid: string
  number: string
}

// One card per line: "04A1B2C3D4E5F6, IR-0101". A UID is 4 or 7 bytes, so 8 or
// 14 hex characters. UIDs must be new everywhere; numbers new in this gym.
export function parseCardLines(
  text: string,
  usedUids: Set<string>,
  usedNumbers: Set<string>,
): { cards: NewCard[]; problems: string[] } {
  const cards: NewCard[] = []
  const problems: string[] = []
  const uids = new Set(usedUids)
  const numbers = new Set(usedNumbers)

  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return
    const [rawUid = '', rawNumber = '', ...extra] = line.split(',')
    const uid = rawUid.replace(/[\s:]/g, '').toUpperCase()
    const number = rawNumber.trim().toUpperCase()
    const problem =
      !/^([0-9A-F]{8}|[0-9A-F]{14})$/.test(uid)
        ? 'the UID must be 8 or 14 characters, 0-9 and A-F'
        : !number || extra.length > 0
          ? 'write it as UID, number'
          : uids.has(uid)
            ? `the UID ${uid} is already registered`
            : numbers.has(number)
              ? `the number ${number} is already used`
              : null
    if (problem) return problems.push(`Line ${i + 1}: ${problem}.`)
    uids.add(uid)
    numbers.add(number)
    cards.push({ uid, number })
  })
  return { cards, problems }
}
