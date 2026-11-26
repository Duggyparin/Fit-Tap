import { MessageSquare } from 'lucide-react'
import { feedbackLink, FEEDBACK_URL } from '../lib/config'
import Icon from './Icon'

// Opens the feedback page (or an email while none is set). Nothing about the
// user or the gym is put in the address.
export default function FeedbackLink({ className }: { className: string }) {
  return (
    <a
      href={feedbackLink()}
      {...(FEEDBACK_URL ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={className}
    >
      <Icon icon={MessageSquare} />
      Send feedback
    </a>
  )
}
