import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L, { type Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RefreshCcw, Loader2, AlertCircle, Crosshair } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { adaptReports, type Report, type ReportCategory } from '../data/adapter'
import { CategoryBadge } from '../components/CategoryBadge'
import { StatusBadge } from '../components/StatusBadge'
import { ReportDrawer } from '../components/ReportDrawer'
import { cn } from '@/design-system/cn'

const OUARZAZATE: [number, number] = [30.92, -6.91]

const PIN_COLOR: Record<ReportCategory, string> = {
  aggressive: '#dc2626', // red-600
  injured: '#f97316', // orange-500
  stray: '#eab308', // yellow-500
}

const PIN_TAILWIND: Record<ReportCategory, string> = {
  aggressive: 'bg-red-600',
  injured: 'bg-orange-500',
  stray: 'bg-yellow-500',
}

/**
 * Build a Leaflet DivIcon for a report — a small filled circle with a tail,
 * coloured by category. Active state is bigger + has a halo so the pin the
 * user is hovering on the sidebar pops out on the map.
 */
function buildIcon(category: ReportCategory, urgent: boolean, active: boolean) {
  const color = PIN_COLOR[category]
  const size = active ? 32 : 24
  const halo = urgent
    ? `<span style="
      position:absolute; inset:0;
      border-radius:9999px;
      background:${color};
      opacity:.45;
      animation: ozn-ping 1.6s cubic-bezier(0,0,.2,1) infinite;
    "></span>`
    : ''
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `
      <span style="position:relative; display:inline-block; width:${size}px; height:${size}px;">
        ${halo}
        <span style="
          position:relative; display:flex; align-items:center; justify-content:center;
          width:${size}px; height:${size}px;
          border-radius:9999px;
          background:${color};
          box-shadow:0 1px 4px rgba(0,0,0,.25);
          border:2px solid #fff;
        ">
          <span style="display:block; width:${active ? 8 : 6}px; height:${active ? 8 : 6}px; border-radius:9999px; background:#fff;"></span>
        </span>
      </span>
    `,
  })
}

/**
 * Auto-fit the map to the visible markers' bounds whenever the list changes.
 * Falls back to centering on Ouarzazate when there's nothing to show.
 */
function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap()
  const lastSig = useRef('')
  useEffect(() => {
    const points: [number, number][] = reports
      .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
      .map((r) => [r.latitude!, r.longitude!])
    // Cheap signature so we don't fight user pan/zoom on unrelated re-renders.
    const sig = `${points.length}:${points.map((p) => p.join(',')).join('|')}`
    if (sig === lastSig.current) return
    lastSig.current = sig
    if (points.length === 0) {
      map.setView(OUARZAZATE, 13)
      return
    }
    if (points.length === 1) {
      map.setView(points[0]!, 15)
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
  }, [reports, map])
  return null
}

type Filter = 'all' | 'urgent' | 'inProgress' | 'resolved'

export function Carte() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  async function load() {
    setRefreshing(true)
    setError(null)
    try {
      // Pull the most recent 200 reports — plenty for the map view; if the
      // commune scales past that we'll add a date-range filter.
      const r = await api.listReports({ pageSize: 200 })
      setReports(adaptReports(r.reports))
      setLastFetched(new Date())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Connexion impossible.')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const visible = useMemo(() => {
    if (!reports) return []
    let rows = reports.filter(
      (r) =>
        // Drop pins that have no geo yet (shouldn't happen with real data,
        // belt-and-braces).
        typeof r.latitude === 'number' &&
        typeof r.longitude === 'number' &&
        // Skip pending/rejected by default — the map is for actionable cases.
        r.status !== 'rejected' &&
        r.status !== 'pending',
    )
    if (filter === 'urgent') rows = rows.filter((r) => r.isUrgent)
    if (filter === 'inProgress')
      rows = rows.filter((r) => r.status === 'inProgress' || r.status === 'assigned')
    if (filter === 'resolved') rows = rows.filter((r) => r.status === 'resolved')
    return rows
  }, [reports, filter])

  function fmtRefresh(d: Date | null) {
    if (!d) return '—'
    const diff = Math.round((Date.now() - d.getTime()) / 1000)
    if (diff < 30) return t('dashboard.map.now')
    if (diff < 120) return `il y a ${diff}s`
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

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
              <span
                className={cn(
                  'size-2 rounded-full',
                  refreshing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse',
                )}
              />
              {t('dashboard.map.lastRefresh')} : {fmtRefresh(lastFetched)}
            </span>
            <button
              onClick={load}
              disabled={refreshing}
              className="size-8 rounded-md hover:bg-gray-100 grid place-items-center text-gray-500 disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCcw className={cn('size-4', refreshing && 'animate-spin')} />
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

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm"
          >
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Map + sidebar */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Map */}
          <div className="lg:col-span-8">
            <div className="relative aspect-[4/3] rounded-md overflow-hidden border border-gray-200 bg-gray-100">
              {reports === null ? (
                <div className="absolute inset-0 grid place-items-center text-gray-400 z-10 bg-white/60">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : null}

              <MapContainer
                ref={(m) => {
                  mapRef.current = m
                }}
                center={OUARZAZATE}
                zoom={13}
                scrollWheelZoom
                className="size-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <FitBounds reports={visible} />
                {visible.map((r) => {
                  const lat = r.latitude!
                  const lng = r.longitude!
                  const isHover = hoverId === r.id
                  return (
                    <Marker
                      key={r.id}
                      position={[lat, lng]}
                      icon={buildIcon(r.category, r.isUrgent, isHover)}
                      eventHandlers={{
                        mouseover: () => setHoverId(r.id),
                        mouseout: () => setHoverId((cur) => (cur === r.id ? null : cur)),
                        click: () => setSelectedId(r.id),
                      }}
                    >
                      <Tooltip
                        direction="top"
                        offset={[0, -28]}
                        opacity={1}
                        className="!bg-white !border !border-gray-200 !rounded-md !shadow-lg !text-gray-900 !p-0"
                      >
                        <div className="p-2 max-w-[14rem]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CategoryBadge category={r.category} />
                            <span className="font-mono text-[10px] text-gray-500">{r.id}</span>
                          </div>
                          <p className="mt-1.5 text-xs font-semibold text-gray-900 truncate">
                            {r.address}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{r.zone}</p>
                          <div className="mt-1.5">
                            <StatusBadge status={r.status} />
                          </div>
                        </div>
                      </Tooltip>
                    </Marker>
                  )
                })}
              </MapContainer>

              {/* Center-on-Ouarzazate control */}
              <button
                aria-label={t('dashboard.map.centerOn')}
                onClick={() => mapRef.current?.setView(OUARZAZATE, 13)}
                className="absolute top-3 end-3 z-[400] size-9 grid place-items-center bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-700"
              >
                <Crosshair className="size-4" />
              </button>
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
                {visible.length} pins
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
              {visible.length === 0 && reports !== null && (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  Aucun pin pour ces filtres.
                </li>
              )}
              {visible.map((r) => {
                const isHover = hoverId === r.id
                return (
                  <li
                    key={r.id}
                    onMouseEnter={() => setHoverId(r.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => {
                      // Pan the map to the pin so the user can see what they clicked,
                      // then open the drawer.
                      if (
                        mapRef.current &&
                        typeof r.latitude === 'number' &&
                        typeof r.longitude === 'number'
                      ) {
                        mapRef.current.setView([r.latitude, r.longitude], 16, { animate: true })
                      }
                      setSelectedId(r.id)
                    }}
                    className={cn(
                      'px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors',
                      isHover ? 'bg-olive-50' : 'hover:bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1 size-2.5 rounded-full ring-4 shrink-0',
                        PIN_TAILWIND[r.category],
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

      <ReportDrawer
        publicRef={selectedId}
        onClose={() => setSelectedId(null)}
        onMutated={() => {
          // After approve/reject/assign from the drawer, refresh the map.
          load()
        }}
      />

      {/* DivIcon ping animation (Leaflet's DivIcon needs the CSS in the document) */}
      <style>{`
        @keyframes ozn-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
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
