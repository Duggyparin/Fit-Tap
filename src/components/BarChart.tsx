import { useState } from 'react'

export interface Bar {
  key: string
  axis: string // short label under the bar
  name: string // full label for the readout and table
  value: number
}

// A simple vertical bar chart made with divs: one series, one color. Hover or
// tap a bar to read it; "Show as table" gives the same numbers as text.
export default function BarChart({
  bars,
  unit,
  labelEvery = 1,
}: {
  bars: Bar[]
  unit: (value: number) => string // e.g. 3 -> "3 check-ins"
  labelEvery?: number // show every nth axis label
}) {
  const [active, setActive] = useState<string | null>(null)
  const max = Math.max(1, ...bars.map((b) => b.value))
  const peak = bars.reduce((best, b) => (b.value > best.value ? b : best), bars[0])
  const shown = bars.find((b) => b.key === active)

  return (
    <div>
      <p className="mb-3 text-sm text-ink-muted" aria-live="polite">
        {shown
          ? `${shown.name}: ${unit(shown.value)}`
          : peak && peak.value > 0
            ? `Busiest: ${peak.name}, ${unit(peak.value)}`
            : 'No data yet'}
      </p>
      <div
        aria-hidden="true"
        onPointerLeave={() => setActive(null)}
        className="flex h-36 items-stretch gap-0.5 border-b border-line"
      >
        {bars.map((bar) => (
          // The whole column is the hover and tap target.
          <div
            key={bar.key}
            onPointerEnter={() => setActive(bar.key)}
            onClick={() => setActive(bar.key)}
            className={`flex min-w-0 flex-1 flex-col justify-end rounded-t ${
              active === bar.key ? 'bg-page' : ''
            }`}
          >
            <div
              className="mx-auto w-full max-w-8 rounded-t bg-navy"
              style={{ height: `${(bar.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex gap-0.5 pt-1 text-xs text-ink-muted">
        {bars.map((bar, i) => (
          <div key={bar.key} className="flex min-w-0 flex-1 justify-center whitespace-nowrap">
            {i % labelEvery === 0 ? bar.axis : ''}
          </div>
        ))}
      </div>
      <details className="mt-2 text-sm">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold text-primary">
          Show as table
        </summary>
        <table className="w-full">
          <tbody className="divide-y divide-line">
            {bars.map((bar) => (
              <tr key={bar.key}>
                <th scope="row" className="py-1.5 text-left font-normal">
                  {bar.name}
                </th>
                <td className="py-1.5 text-right">{unit(bar.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
