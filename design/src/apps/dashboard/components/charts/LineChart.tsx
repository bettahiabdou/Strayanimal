import { useId } from 'react'
import { cn } from '@/design-system/cn'

type Props = {
  data: number[]
  /** Tailwind color name token used by stroke (e.g. 'olive-600' or 'red-600') */
  stroke?: string
  /** Gradient fill color (matches stroke if omitted) */
  fill?: string
  height?: number
  showAxis?: boolean
  className?: string
  formatY?: (n: number) => string
}

export function LineChart({
  data,
  stroke = 'var(--color-olive-600)',
  fill,
  height = 200,
  showAxis = true,
  className,
  formatY = (n) => String(n),
}: Props) {
  const id = useId()
  const padTop = 16
  const padRight = 16
  const padBottom = showAxis ? 26 : 8
  const padLeft = showAxis ? 36 : 8
  const width = 800
  const innerW = width - padLeft - padRight
  const innerH = height - padTop - padBottom

  const max = Math.max(...data) * 1.15
  const min = Math.min(0, Math.min(...data))
  const span = max - min || 1
  const stepX = innerW / Math.max(1, data.length - 1)

  const points = data.map((v, i) => {
    const x = padLeft + i * stepX
    const y = padTop + (1 - (v - min) / span) * innerH
    return { x, y, v }
  })

  // Smooth path (Catmull-Rom-ish via simple cubic bezier)
  const path = points
    .map((p, i, arr) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      const prev = arr[i - 1]
      const cx = (prev.x + p.x) / 2
      return `C ${cx.toFixed(1)} ${prev.y.toFixed(1)}, ${cx.toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    })
    .join(' ')

  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${padLeft.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`

  const yTicks = 4
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => min + (span / yTicks) * i)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full', className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill ?? stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={fill ?? stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid + labels */}
      {showAxis &&
        tickValues.map((v, i) => {
          const y = padTop + (1 - (v - min) / span) * innerH
          return (
            <g key={i}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="3 4"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#9CA3AF"
                fontFamily="Public Sans, sans-serif"
              >
                {formatY(Math.round(v))}
              </text>
            </g>
          )
        })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${id})`} />

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Last point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill={stroke}
          stroke="#fff"
          strokeWidth="2"
        />
      )}
    </svg>
  )
}
