import { Camera, RefreshCw, SwitchCamera, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { photoFromFile, toMemberPhoto } from '../lib/photo'
import Button from './Button'
import Icon from './Icon'

// Takes the member photo on the spot. Uses a live camera preview when the
// browser allows it (HTTPS or localhost); otherwise it opens the phone's
// camera app through a file input.
export default function PhotoCapture({
  value,
  onChange,
  error,
}: {
  value: string | null // the photo as a data: URL
  onChange: (photo: string | null) => void
  error?: string | null
}) {
  const supported = Boolean(navigator.mediaDevices?.getUserMedia)
  const [live, setLive] = useState(false)
  const [ready, setReady] = useState(false)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [problem, setProblem] = useState<string | null>(null)
  const video = useRef<HTMLVideoElement>(null)

  // Run the camera only while the preview is showing, and always stop it.
  useEffect(() => {
    if (!live) return
    let stream: MediaStream | undefined
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream = s
        if (video.current) video.current.srcObject = s
      })
      .catch(() => {
        if (cancelled) return
        setProblem('The camera could not be opened. Allow camera access, or use the button below.')
        setLive(false)
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [live, facing])

  function open() {
    setProblem(null)
    setReady(false)
    onChange(null)
    setLive(true)
  }

  function take() {
    const v = video.current!
    onChange(toMemberPhoto(v, v.videoWidth, v.videoHeight))
    setLive(false)
  }

  async function fromFile(file: File | undefined) {
    if (!file) return
    try {
      onChange(await photoFromFile(file))
      setProblem(null)
    } catch {
      setProblem('That photo could not be read. Please take it again.')
    }
  }

  const useFileInput = !supported || problem !== null

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-card p-4">
      <p className="self-start text-sm font-semibold">Member photo (required)</p>

      <div
        className={`flex aspect-square w-full max-w-64 items-center justify-center overflow-hidden rounded-xl border bg-page ${
          error ? 'border-danger' : 'border-line'
        }`}
      >
        {value ? (
          <img src={value} alt="Photo just taken" className="size-full object-cover" />
        ) : live ? (
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            onPlaying={() => setReady(true)}
            className="size-full object-cover"
          />
        ) : (
          <Icon icon={Camera} size={48} className="text-ink-muted" />
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm font-medium">
          <Icon icon={TriangleAlert} size={16} className="text-danger" />
          {error}
        </p>
      )}
      {problem && <p className="text-center text-sm">{problem}</p>}

      <div className="flex flex-wrap justify-center gap-2">
        {live ? (
          <>
            <Button icon={Camera} onClick={take} disabled={!ready}>
              Take photo
            </Button>
            <Button
              variant="secondary"
              icon={SwitchCamera}
              onClick={() => {
                setReady(false)
                setFacing(facing === 'user' ? 'environment' : 'user')
              }}
            >
              Switch camera
            </Button>
            <Button variant="secondary" onClick={() => setLive(false)}>
              Cancel
            </Button>
          </>
        ) : (
          supported && (
            <Button
              variant={value ? 'secondary' : 'primary'}
              icon={value ? RefreshCw : Camera}
              onClick={open}
              data-photo-button
            >
              {value ? 'Retake' : 'Open camera'}
            </Button>
          )
        )}
        {useFileInput && !live && (
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-primary">
            <Icon icon={Camera} size={18} />
            {value ? 'Retake with camera app' : 'Use camera app'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                void fromFile(e.target.files?.[0])
                e.target.value = '' // allow picking again
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}
