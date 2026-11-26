import type { Scanner, Timestamp } from '../types'
import { SCANNER_ONLINE_MINUTES } from './constants'

export function isScannerOnline(
  scanner: Pick<Scanner, 'last_seen_at'>,
  now: number = Date.now(),
): boolean {
  const seen: Timestamp | null = scanner.last_seen_at
  return seen !== null && now - Date.parse(seen) <= SCANNER_ONLINE_MINUTES * 60_000
}
