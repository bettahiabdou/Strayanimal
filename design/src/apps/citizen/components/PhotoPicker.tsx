import { useRef, useState } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

const MAX_DIM = 1280 // px on the longest side
const JPEG_QUALITY = 0.82
const MAX_FILES = 3
const ACCEPT = 'image/jpeg,image/png,image/webp'

type Props = {
  /** Photos as data URLs (data:image/jpeg;base64,...). */
  value: string[]
  onChange: (next: string[]) => void
  hint?: string
  label: string
  uploadLabel: string
}

export function PhotoPicker({ value, onChange, hint, label, uploadLabel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    setError(null)
    setBusy(true)
    try {
      const next = [...value]
      const remaining = MAX_FILES - next.length
      const accepted = Array.from(files).slice(0, remaining)
      for (const f of accepted) {
        if (!ACCEPT.split(',').includes(f.type)) {
          setError(`Format non supporté : ${f.name}`)
          continue
        }
        const dataUrl = await resizeToDataUrl(f)
        next.push(dataUrl)
      }
      onChange(next)
    } catch (e) {
      setError((e as Error).message || 'Échec du traitement de la photo.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-800 mb-2">{label}</span>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {value.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200"
            >
              <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Supprimer cette photo"
                className="absolute top-1 end-1 size-6 rounded-full bg-red-600 text-white grid place-items-center hover:bg-red-700 shadow"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < MAX_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-red-500 rounded-lg py-8 cursor-pointer transition-colors text-gray-500 hover:text-red-600 disabled:opacity-60 disabled:cursor-wait"
        >
          {busy ? (
            <Loader2 className="size-6 animate-spin" />
          ) : value.length === 0 ? (
            <Upload className="size-6" />
          ) : (
            <ImageIcon className="size-6" />
          )}
          <span className="text-sm font-medium">
            {busy ? 'Préparation…' : value.length === 0 ? uploadLabel : 'Ajouter une autre photo'}
          </span>
          <span className="text-[10px] text-gray-400">
            {value.length}/{MAX_FILES} · JPEG/PNG/WebP · max 4 MB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        capture="environment"
        className="sr-only"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="text-xs text-red-600 mt-2">
          {error}
        </p>
      )}
      {hint && !error && <span className="block text-xs text-gray-500 mt-1.5">{hint}</span>}
    </label>
  )
}

/**
 * Read a File, fit it inside MAX_DIM × MAX_DIM (preserving aspect ratio),
 * encode as JPEG at JPEG_QUALITY, return the result as a data URL.
 * Honours EXIF orientation thanks to createImageBitmap({ imageOrientation: 'from-image' }).
 */
async function resizeToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  })
  const { width: w, height: h } = bitmap
  const scale = Math.min(1, MAX_DIM / Math.max(w, h))
  const targetW = Math.round(w * scale)
  const targetH = Math.round(h * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible.')
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close?.()

  // Encode as JPEG to keep size small, except for transparent PNGs we keep PNG.
  const mime = file.type === 'image/png' ? 'image/jpeg' : 'image/jpeg'
  return canvas.toDataURL(mime, JPEG_QUALITY)
}
