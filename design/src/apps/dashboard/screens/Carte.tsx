import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Minus, Layers, Crosshair, RefreshCcw, ExternalLink } from 'lucide-react'
import { MOCK_REPORTS, type Report, type ReportCategory } from '../data/mockReports'
import { CategoryBadge } from '../components/CategoryBadge'
import { StatusBadge } from '../components/StatusBadge'
import { ReportDrawer } from '../components/ReportDrawer'
import { FauxMap } from '../components/FauxMap'
import { cn } from '@/design-system/cn'

/** Hardcoded display positions on the faux-map (percent of map area). */
const PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'OZN-2618-47': { x: 42, y: 38 },
  'OZN-2618-46': { x: 58, y: 52 },
  'OZN-2618-45': { x: 70, y: 30 },
  'OZN-2618-44': { x: 28, y: 60 },
  'OZN-2618-43': { x: 62, y: 70 },
  'OZN-2618-42': { x: 35, y: 25 },
  'OZN-2618-41': { x: 80, y: 58 },
  'OZN-2618-40': { x: 50, y: 18 },
}

const PIN_COLOR: Record<ReportCategory, string> = {
  aggressive: 'bg-red-600',
  injured: 'bg-orange-500',
  stray: 'bg-yellow-500',
}

type Filter = 'all' | 'urgent' | 'inProgress' | 'resolved'

export function Carte() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visible = useMemo(() => {
    let rows: Report[] = MOCK_REPORTS.filter(
      (r) => r.status !== 'rejected' && r.status !== 'pending',
    )
    if (filter === 'urgent') rows = rows.filter((r) => r.isUrgent)
    if (filter === 'inProgress')
      rows = rows.filter((r) => r.status === 'inProgress' || r.status === 'assigned')
    if (filter === 'resolved') rows = rows.filter((r) => r.status === 'resolved')
    return rows
  }, [filter])

  const selected = MOCK_REPORTS.find((r) => r.id === selectedId) ?? null

  return (
    <>
      <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {t('dashboard.map.title')}
            </h1>
            <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.map.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('dashboard.map.lastRefresh')} : {t('dashboard.map.now')}
            </span>
            <button
              className="size-8 rounded-md hover:bg-gray-100 grid place-items-center text-gray-500"
              aria-label="Refresh"
            >
              <RefreshCcw className="size-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-md inline-flex p-1">
            {(['all', 'urgent', 'inProgress', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
                  filter === f ? 'bg-olive-700 text-white' : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {t(
                  `dashboard.map.filter${f === 'all' ? 'All' : f === 'urgent' ? 'Urgent' : f === 'inProgress' ? 'InProgress' : 'Resolved'}`,
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {t('dashboard.map.visiblePins', { count: visible.length })}
          </span>
        </div>

        {/* Map + sidebar */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Map */}
          <div className="lg:col-span-8">
            <div className="relative aspect-[4/3] rounded-md overflow-hidden border border-gray-200 bg-[#F4EEDF] shadow-inner">
              <FauxMap />

              {/* Pins */}
              {visible.map((r) => {
                const pos = PIN_POSITIONS[r.id]
                if (!pos) return null
                const isHover = hoverId === r.id
                return (
                  <button
                    key={r.id}
                    onMouseEnter={() => setHoverId(r.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => setSelectedId(r.id)}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-full group"
                    aria-label={`Pin ${r.id}`}
                  >
                    <Pin category={r.category} urgent={r.isUrgent} active={isHover} />
                    {isHover && (
                      <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-56 bg-white rounded-md border border-gray-200 shadow-lg overflow-hidden">
                        <div className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CategoryBadge category={r.category} />
                            <span className="font-mono text-[10px] text-gray-500">{r.id}</span>
                          </div>
                          <p className="mt-2 text-xs font-semibold text-gray-900 truncate">
                            {r.address}
                          </p>
                          <p className="text-[11px] text-gray-500">{r.zone}</p>
                        </div>
                        <div className="px-3 pb-2">
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Map controls */}
              <div className="absolute top-3 end-3 z-10 flex flex-col gap-1.5">
                <div className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col">
                  <button
                    aria-label={t('dashboard.map.zoomIn')}
                    className="size-9 grid place-items-center hover:bg-gray-50 text-gray-700 border-b border-gray-200"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    aria-label={t('dashboard.map.zoomOut')}
                    className="size-9 grid place-items-center hover:bg-gray-50 text-gray-700"
                  >
                    <Minus className="size-4" />
                  </button>
                </div>
                <button
                  aria-label={t('dashboard.map.centerOn')}
                  className="size-9 grid place-items-center bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-700"
                >
                  <Crosshair className="size-4" />
                </button>
                <button
                  aria-label={t('dashboard.map.layers')}
                  className="size-9 grid place-items-center bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-700"
                >
                  <Layers className="size-4" />
                </button>
              </div>

              {/* Bottom-left location label */}
              <div className="absolute bottom-3 start-3 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-md px-3 py-1.5 text-[11px] text-gray-700 font-medium shadow-sm">
                Ouarzazate · 30.92°N, 6.91°O · zoom 13
              </div>

              {/* Bottom-right OSM credit */}
              <a
                href="https://www.openstreetmap.org/#map=13/30.92/-6.91"
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 end-3 z-10 inline-flex items-center gap-1 text-[10px] text-gray-700 bg-white/95 backdrop-blur border border-gray-200 rounded px-2 py-1 hover:bg-white"
              >
                {t('dashboard.map.viewOSM')}
                <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Legend */}
            <div className="mt-3 bg-white border border-gray-200 rounded-md px-4 py-3 flex items-center gap-6 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t('dashboard.map.legend')}
              </span>
              <LegendItem color="bg-red-600" label="Agressif" />
              <LegendItem color="bg-orange-500" label="Blessé" />
              <LegendItem color="bg-yellow-500" label="Errant" />
              <span className="ms-auto text-[11px] text-gray-500 font-mono">
                {visible.length} pins · zoom 13
              </span>
            </div>
          </div>

          {/* Pin list */}
          <aside className="lg:col-span-4 bg-white border border-gray-200 rounded-md flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Sur la carte
              </p>
              <p className="font-mono text-2xl font-bold text-gray-900 mt-0.5">{visible.length}</p>
            </div>
            <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {visible.map((r) => {
                const isHover = hoverId === r.id
                return (
                  <li
                    key={r.id}
                    onMouseEnter={() => setHoverId(r.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      'px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors',
                      isHover ? 'bg-olive-50' : 'hover:bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1 size-2.5 rounded-full ring-4 shrink-0',
                        PIN_COLOR[r.category],
                        r.isUrgent ? 'ring-red-100' : 'ring-gray-100',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-gray-500">{r.id}</span>
                        {r.isUrgent && (
                          <span className="text-[9px] font-bold uppercase text-red-600">
                            ● Urgent
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
                        {r.address}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{r.zone}</p>
                      <div className="mt-1.5">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      </div>

      <ReportDrawer report={selected} onClose={() => setSelectedId(null)} />
    </>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-gray-700">
      <span className={cn('size-2.5 rounded-full', color)} />
      {label}
    </span>
  )
}

function Pin({
  category,
  urgent,
  active,
}: {
  category: ReportCategory
  urgent: boolean
  active: boolean
}) {
  return (
    <span className="relative inline-block">
      {urgent && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-60',
            PIN_COLOR[category],
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-grid place-items-center rounded-full ring-2 ring-white shadow-md transition-transform',
          PIN_COLOR[category],
          active ? 'size-7' : 'size-5',
        )}
      >
        <span className="block size-1.5 rounded-full bg-white" />
      </span>
      <span
        className={cn(
          'absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rotate-45',
          PIN_COLOR[category],
        )}
      />
    </span>
  )
}
