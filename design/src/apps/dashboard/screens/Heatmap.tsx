import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flame, Layers, Crosshair, ExternalLink } from 'lucide-react'
import { FauxMap } from '../components/FauxMap'
import { cn } from '@/design-system/cn'

type Range = 'today' | 'week' | 'month' | 'quarter' | 'year'
type Cat = 'all' | 'aggressive' | 'injured' | 'stray'

/* Coords match the FauxMap (1000 x 750 viewBox).
 * Each hotspot has a center, intensity (0..1) and category. */
type Hotspot = {
  cx: number
  cy: number
  intensity: number
  category: 'aggressive' | 'injured' | 'stray'
  zone: string
}

const HOTSPOTS: Hotspot[] = [
  { cx: 215, cy: 200, intensity: 0.95, category: 'aggressive', zone: 'Hay Al Wahda' },
  { cx: 165, cy: 235, intensity: 0.55, category: 'stray', zone: 'Hay Al Wahda' },
  { cx: 270, cy: 180, intensity: 0.4, category: 'injured', zone: 'Hay Al Wahda' },
  { cx: 540, cy: 165, intensity: 0.85, category: 'injured', zone: 'Sidi Daoud' },
  { cx: 580, cy: 220, intensity: 0.5, category: 'stray', zone: 'Sidi Daoud' },
  { cx: 480, cy: 200, intensity: 0.3, category: 'aggressive', zone: 'Sidi Daoud' },
  { cx: 760, cy: 240, intensity: 0.7, category: 'stray', zone: 'Tinzouline' },
  { cx: 820, cy: 320, intensity: 0.45, category: 'injured', zone: 'Tinzouline' },
  { cx: 180, cy: 480, intensity: 0.65, category: 'stray', zone: 'Tabounte' },
  { cx: 230, cy: 540, intensity: 0.4, category: 'injured', zone: 'Tabounte' },
  { cx: 290, cy: 470, intensity: 0.3, category: 'stray', zone: 'Tabounte' },
  { cx: 540, cy: 470, intensity: 0.6, category: 'aggressive', zone: 'Centre' },
  { cx: 510, cy: 530, intensity: 0.45, category: 'injured', zone: 'Centre' },
  { cx: 770, cy: 580, intensity: 0.4, category: 'stray', zone: 'Tarmigt' },
  { cx: 820, cy: 620, intensity: 0.25, category: 'injured', zone: 'Tarmigt' },
]

const ZONE_COUNTS: Record<string, number> = {
  'Hay Al Wahda': 142,
  'Sidi Daoud': 118,
  Tabounte: 96,
  'Hay Al Massira': 84,
  Tarmigt: 71,
  Tinzouline: 58,
  'Hay Annahda': 47,
  'Hay Salam': 32,
}

function intensityLabel(v: number): { label: string; tone: string } {
  if (v >= 0.8) return { label: 'critical', tone: 'bg-red-100 text-red-700 border-red-200' }
  if (v >= 0.6) return { label: 'high', tone: 'bg-orange-100 text-orange-700 border-orange-200' }
  if (v >= 0.4) return { label: 'medium', tone: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  return { label: 'low', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
}

export function Heatmap() {
  const { t } = useTranslation()
  const [range, setRange] = useState<Range>('month')
  const [cat, setCat] = useState<Cat>('all')

  const visibleHotspots = useMemo(
    () => (cat === 'all' ? HOTSPOTS : HOTSPOTS.filter((h) => h.category === cat)),
    [cat],
  )

  const sortedZones = useMemo(
    () =>
      Object.entries(ZONE_COUNTS)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    [],
  )

  const max = sortedZones[0]?.count ?? 1
  const totalCount = sortedZones.reduce((s, x) => s + x.count, 0)

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight inline-flex items-center gap-2">
            <Flame className="size-6 text-red-600" />
            {t('dashboard.heatmap.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.heatmap.subtitle')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md inline-flex p-1">
          {(['today', 'week', 'month', 'quarter', 'year'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
                range === r ? 'bg-olive-700 text-white' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {t(`dashboard.heatmap.range.${r}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar — category filter + count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="bg-white border border-gray-200 rounded-md inline-flex p-1">
          {(['all', 'aggressive', 'injured', 'stray'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
                cat === c ? 'bg-olive-700 text-white' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {t(`dashboard.heatmap.category.${c}`)}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {t('dashboard.heatmap.totalReports', { count: totalCount })}
        </span>
      </div>

      {/* Map + side panel */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Heatmap canvas */}
        <div className="lg:col-span-8">
          <div className="relative aspect-[4/3] rounded-md overflow-hidden border border-gray-200 bg-[#F4EEDF] shadow-inner">
            <FauxMap />
            <HeatLayer hotspots={visibleHotspots} />

            {/* Map controls */}
            <div className="absolute top-3 end-3 z-10 flex flex-col gap-1.5">
              <button
                aria-label={t('dashboard.heatmap.recenter')}
                className="size-9 grid place-items-center bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-700"
              >
                <Crosshair className="size-4" />
              </button>
              <button
                aria-label={t('dashboard.heatmap.layersAria')}
                className="size-9 grid place-items-center bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-700"
              >
                <Layers className="size-4" />
              </button>
            </div>

            {/* Coordinate strip */}
            <div className="absolute bottom-3 start-3 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-md px-3 py-1.5 text-[11px] text-gray-700 font-medium shadow-sm">
              {t('dashboard.heatmap.coordinates')}
            </div>

            {/* OSM credit */}
            <a
              href="https://www.openstreetmap.org/#map=13/30.92/-6.91"
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 end-3 z-10 inline-flex items-center gap-1 text-[10px] text-gray-700 bg-white/95 backdrop-blur border border-gray-200 rounded px-2 py-1 hover:bg-white"
            >
              OpenStreetMap
              <ExternalLink className="size-3" />
            </a>
          </div>

          {/* Legend bar */}
          <div className="mt-3 bg-white border border-gray-200 rounded-md px-4 py-3 flex items-center gap-6 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              {t('dashboard.heatmap.intensity')}
            </span>
            <div className="flex-1 min-w-64 max-w-md flex items-center gap-2">
              <span className="text-[11px] text-gray-500 font-mono">
                {t('dashboard.heatmap.low')}
              </span>
              <div
                className="flex-1 h-3 rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, rgba(250,204,21,0.6), rgba(249,115,22,0.7), rgba(220,38,38,0.85))',
                }}
              />
              <span className="text-[11px] text-red-700 font-mono font-semibold">
                {t('dashboard.heatmap.critical')}
              </span>
            </div>
            <span className="ms-auto text-[11px] text-gray-500 font-mono">
              {t('dashboard.heatmap.pointsCount', { count: visibleHotspots.length })}
            </span>
          </div>
        </div>

        {/* Top zones panel */}
        <aside className="lg:col-span-4 bg-white border border-gray-200 rounded-md flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              {t('dashboard.heatmap.topZones')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('dashboard.heatmap.topZonesSubtitle')}
            </p>
          </div>
          {sortedZones.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">{t('dashboard.heatmap.noShow')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedZones.map((z, i) => {
                const intensity = z.count / max
                const tag = intensityLabel(intensity)
                return (
                  <li key={z.name} className="px-4 py-3 flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-400 w-5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {z.name}
                        </span>
                        <span className="font-mono text-sm text-gray-700">{z.count}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${intensity * 100}%`,
                              background:
                                intensity >= 0.8
                                  ? '#dc2626'
                                  : intensity >= 0.6
                                    ? '#f97316'
                                    : intensity >= 0.4
                                      ? '#eab308'
                                      : '#10b981',
                            }}
                          />
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                            tag.tone,
                          )}
                        >
                          {t(`dashboard.heatmap.${tag.label}`)}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}

function HeatLayer({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <svg
      className="absolute inset-0 size-full pointer-events-none"
      viewBox="0 0 1000 750"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="heat-low" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#facc15" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heat-mid" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
          <stop offset="55%" stopColor="#f97316" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#dc2626" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>
        <filter id="heat-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g filter="url(#heat-blur)" style={{ mixBlendMode: 'multiply' }}>
        {hotspots.map((h, i) => {
          const grad =
            h.intensity >= 0.7 ? 'heat-high' : h.intensity >= 0.45 ? 'heat-mid' : 'heat-low'
          const r = 65 + h.intensity * 90
          return <circle key={i} cx={h.cx} cy={h.cy} r={r} fill={`url(#${grad})`} />
        })}
      </g>
      {/* Hard center dot for the strongest hotspots */}
      {hotspots
        .filter((h) => h.intensity >= 0.8)
        .map((h, i) => (
          <circle
            key={`core-${i}`}
            cx={h.cx}
            cy={h.cy}
            r={6}
            fill="#dc2626"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
    </svg>
  )
}
