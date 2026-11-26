// A ring that empties as the seconds run out.
export default function CountdownRing({
  secondsLeft,
  total,
}: {
  secondsLeft: number
  total: number
}) {
  const radius = 44
  const length = 2 * Math.PI * radius

  return (
    <div
      role="timer"
      aria-label={`${secondsLeft} seconds left`}
      className="relative flex size-28 items-center justify-center"
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" className="stroke-line" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - secondsLeft / total)}
          className="stroke-navy transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-navy">{secondsLeft}</span>
        <span className="text-xs text-ink-muted">seconds</span>
      </span>
    </div>
  )
}
