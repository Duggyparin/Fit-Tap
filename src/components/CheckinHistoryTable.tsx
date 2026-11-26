import type { CheckinView } from '../lib/data'
import { formatTime } from '../lib/format'
import { CHECKIN_STATUS, SOURCE_LABEL } from '../lib/status'
import StatusBadge from './StatusBadge'

// The compact desktop view of the same taps.
export default function CheckinHistoryTable({ views }: { views: CheckinView[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full text-left text-sm">
        <caption className="px-3 pt-4 pb-2 text-left font-semibold">Today’s history</caption>
        <thead className="border-b border-line text-ink-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Time</th>
            <th scope="col" className="px-2 py-2 font-medium">Member</th>
            <th scope="col" className="px-2 py-2 font-medium">Result</th>
            <th scope="col" className="px-3 py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {views.map(({ checkin, member }) => (
            <tr key={checkin.checkin_id}>
              <td className="px-3 py-3 whitespace-nowrap">{formatTime(checkin.scanned_at)}</td>
              <td className="px-2 py-3 font-medium">{member?.full_name ?? 'Unknown card'}</td>
              <td className="px-2 py-3">
                <StatusBadge {...CHECKIN_STATUS[checkin.result]} />
              </td>
              <td className="px-3 py-3 text-ink-muted">{SOURCE_LABEL[checkin.source]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
