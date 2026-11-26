import type { LucideIcon } from 'lucide-react'

// Thin wrapper around lucide icons so every icon has the same size and stroke.
// Icons are decoration: always put a text label (or aria-label) next to them.
export default function Icon({
  icon: Glyph,
  size = 20,
  className,
}: {
  icon: LucideIcon
  size?: number
  className?: string
}) {
  return <Glyph size={size} strokeWidth={1.8} className={className} aria-hidden="true" />
}
