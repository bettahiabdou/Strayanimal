import { cn } from '@/design-system/cn'

type Slice = {
  label: string
  value: number
  /** CSS color (e.g. '#dc2626' or 'var(--color-red-600)') */
  color: string
}

type Props = {
  slices: Slice[]
  size?: number
  thickness?: number
  centerValue?: string
  centerLabel?: string
  className?: string
}

export function Donut({
  slices,
  size = 180,
  thickness = 22,
  centerValue,
  centerLabel,
  className,
}: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1
  const radius = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * radius
  let offset = 0

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn(className)}
      style={{ width: size, height: size }}
    >
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={thickness} />
      {slices.map((s, i) => {
        const len = (s.value / total) * circ
        const dasharray = `${len} ${circ - len}`
        const dashoffset = -offset
        offset += len
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        )
      })}
      {centerValue && (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#111827"
          fontFamily="Public Sans, sans-serif"
        >
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fontSize="9"
          letterSpacing="1.5"
          fill="#6B7280"
          fontFamily="Public Sans, sans-serif"
        >
          {centerLabel.toUpperCase()}
        </text>
      )}
    </svg>
  )
}
