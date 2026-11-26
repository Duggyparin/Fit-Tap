import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import Icon from './Icon'
import OfflineBanner from './OfflineBanner'

// A full-screen sheet on phones and a centered dialog from lg. The browser's
// <dialog> keeps keyboard focus inside and closes on Escape. Render it only
// while it should be open.
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current!
    if (!dialog.open) dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => dialog.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Ignore close events that arrive after the dialog was reopened.
      onClose={() => {
        if (!ref.current?.open) onClose()
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none flex-col bg-page p-0 text-ink backdrop:bg-navy/60 open:flex lg:m-auto lg:h-fit lg:max-h-[90dvh] lg:max-w-lg lg:rounded-2xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-line bg-card py-2 pr-2 pl-4">
        <h2 id={titleId} className="text-lg font-bold text-navy">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-page"
        >
          <Icon icon={X} />
        </button>
      </header>
      {/* The page's own banner is hidden behind the dialog, so show it here. */}
      <OfflineBanner />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </dialog>
  )
}
