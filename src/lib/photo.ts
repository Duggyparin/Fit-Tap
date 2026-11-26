// Shrinks a camera picture to a small square JPEG, so member photos stay
// around 30 to 80 KB (Supabase's free storage is limited).

const SIDE = 400
const MAX_BYTES = 80 * 1024

export function toMemberPhoto(source: CanvasImageSource, width: number, height: number): string {
  // Cut the largest centered square, then scale it down to 400 px.
  const crop = Math.min(width, height)
  const side = Math.min(SIDE, crop)
  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  canvas
    .getContext('2d')!
    .drawImage(source, (width - crop) / 2, (height - crop) / 2, crop, crop, 0, 0, side, side)

  // Lower the quality only as far as needed to get under the limit.
  let url = ''
  for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    url = canvas.toDataURL('image/jpeg', quality)
    if (url.length * 0.75 <= MAX_BYTES) break
  }
  return url
}

// A QR picture must stay sharp enough to scan: keep up to 900 px, as PNG
// unless that is large.
export async function qrFromFile(file: File): Promise<string> {
  const image = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, 900 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext('2d')!
  context.fillStyle = 'white' // transparent backgrounds would scan badly
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()
  const png = canvas.toDataURL('image/png')
  return png.length * 0.75 <= 500 * 1024 ? png : canvas.toDataURL('image/jpeg', 0.92)
}

export async function photoFromFile(file: File): Promise<string> {
  // 'from-image' keeps phone photos the right way up.
  const image = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const url = toMemberPhoto(image, image.width, image.height)
  image.close()
  return url
}
