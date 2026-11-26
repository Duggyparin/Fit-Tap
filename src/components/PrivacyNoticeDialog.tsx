import { useGym, usePrivacyContact } from '../lib/data'
import { privacyNotice, PRIVACY_STATUS, PRIVACY_VERSION } from '../lib/privacy'
import Button from './Button'
import Modal from './Modal'

export default function PrivacyNoticeDialog({ onClose }: { onClose: () => void }) {
  const gym = useGym().data
  const contact = usePrivacyContact().data

  return (
    <Modal title="Privacy notice" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-warning bg-card p-3 text-sm font-semibold">
          {PRIVACY_STATUS} · version {PRIVACY_VERSION}
        </p>
        {privacyNotice(gym.gym_name, contact).map((section) => (
          <section key={section.title}>
            <h3 className="font-semibold">{section.title}</h3>
            <p className="text-sm break-words">{section.text}</p>
          </section>
        ))}
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}
