import { useState } from 'react'
import { cn } from './cn'

type Props = {
  size?: number
  className?: string
}

/**
 * Renders /logo.png if present, otherwise a styled placeholder evoking
 * the GCT Ouarzazate seal (olive ring with a Moroccan emblem inside).
 * Drop the real PNG at design/public/logo.png and it will appear automatically.
 */
export function CommuneLogo({ size = 56, className }: Props) {
  const [hasImage, setHasImage] = useState(true)
  if (hasImage) {
    return (
      <img
        src="/logo.png"
        width={size}
        height={size}
        alt="Groupement des Collectivités Territoriales pour la Prévention et la Santé Publique — Ouarzazate"
        className={cn('rounded-full object-cover', className)}
        onError={() => setHasImage(false)}
      />
    )
  }
  return (
    <div
      className={cn('rounded-full grid place-items-center font-display italic relative', className)}
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle at 30% 30%, var(--color-olive-400), var(--color-olive-600) 70%)',
        boxShadow: 'inset 0 0 0 3px var(--color-paper-50), inset 0 0 0 4px var(--color-olive-700)',
      }}
      title="Logo de la commune (placeholder)"
    >
      <span
        className="text-paper-50 font-display tracking-tight"
        style={{ fontSize: size * 0.35, fontWeight: 500 }}
      >
        GCT
      </span>
    </div>
  )
}
