import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Clock, Truck, ChevronRight, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { adaptMissions } from '../data/adapter'
import type { Mission, MissionCategory, MissionStatus } from '../data/mockMissions'
import { cn } from '@/design-system/cn'

const CATEGORY_TONE: Record<MissionCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const STATUS_TONE: Record<MissionStatus, { dot: string; label: string }> = {
  assigned: { dot: 'bg-blue-500', label: 'assigned' },
  enRoute: { dot: 'bg-orange-500 animate-pulse', label: 'enRoute' },
  onSite: { dot: 'bg-violet-500 animate-pulse', label: 'onSite' },
  captured: { dot: 'bg-emerald-500', label: 'captured' },
  impossible: { dot: 'bg-rose-500', label: 'impossible' },
  completed: { dot: 'bg-emerald-500', label: 'completed' },
}

function useTimeAgo() {
  const { t } = useTranslation()
  return (iso: string) => {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (diff < 1) return t('common.timeAgo.justNow')
    if (diff < 60) return t('common.timeAgo.minutes', { count: diff })
    return t('common.timeAgo.hours', { count: Math.floor(diff / 60) })
  }
}

type Filter = 'all' | 'urgent' | 'enRoute'

export function Inbox() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [missions, setMissions] = useState<Mission[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const Chevron = i18n.dir() === 'rtl' ? ChevronLeft : ChevronRight

  useEffect(() => {
    let cancelled = false
    setError(null)
    api
      .myMissions('active')
      .then((r) => {
        if (!cancelled) setMissions(adaptMissions(r.missions))
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : t('fieldTeam.mission.errors.network'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    const rows = missions ?? []
    let out = [...rows]
    if (filter === 'urgent') out = out.filter((m) => m.isUrgent)
    if (filter === 'enRoute')
      out = out.filter((m) => m.status === 'enRoute' || m.status === 'onSite')
    // Sort: urgent first, then enRoute/onSite, then assigned.
    return out.sort((a, b) => {
      const order: Record<MissionStatus, number> = {
        enRoute: 0,
        onSite: 1,
        assigned: 2,
        captured: 3,
        impossible: 4,
        completed: 5,
      }
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1
      return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    })
  }, [missions, filter])

  const newCount = (missions ?? []).filter((m) => m.status === 'assigned').length

  return (
    <div className="pb-4">
      {/* Title + new badge */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {t('fieldTeam.inbox.title')}
          </h1>
          {newCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold">
              <span className="size-1.5 rounded-full bg-red-600 animate-pulse" />
              {t('fieldTeam.inbox.newCount', { count: newCount })}
            </span>
          )}
        </div>

        {/* Filter pills */}
        <div className="mt-4 bg-white border border-gray-200 rounded-md inline-flex p-0.5 w-full">
          {(['all', 'urgent', 'enRoute'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors',
                filter === f ? 'bg-olive-700 text-white' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {t(
                `fieldTeam.inbox.filter${f === 'all' ? 'All' : f === 'urgent' ? 'Urgent' : 'EnRoute'}`,
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-xs">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {missions === null && !error && (
        <div className="px-5 py-12 grid place-items-center text-gray-400">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {/* List */}
      {missions !== null && visible.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <Truck className="size-10 text-gray-300 mx-auto" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-gray-700">{t('fieldTeam.inbox.empty')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('fieldTeam.inbox.emptySubtitle')}</p>
        </div>
      ) : (
        missions !== null && (
          <ul className="px-5 space-y-3">
            {visible.map((m) => (
              <li key={m.id}>
                <MissionCard mission={m} chevron={<Chevron className="size-4" />} t={t} />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}

function MissionCard({
  mission,
  chevron,
  t,
}: {
  mission: Mission
  chevron: React.ReactNode
  t: ReturnType<typeof useTranslation>['t']
}) {
  const timeAgo = useTimeAgo()
  const statusTone = STATUS_TONE[mission.status]
  return (
    <Link
      to={`/field-team/mission/${mission.id}`}
      className={cn(
        'block bg-white rounded-lg border overflow-hidden active:scale-[0.99] transition-transform',
        mission.isUrgent ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200',
      )}
    >
      <div className="flex">
        <div className="size-24 bg-gray-100 shrink-0 relative">
          <img src={mission.photoUrl} alt="" className="size-full object-cover" loading="lazy" />
          {mission.isUrgent && (
            <span className="absolute top-1.5 start-1.5 inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
              <span className="size-1 rounded-full bg-white animate-pulse" />
              {t('fieldTeam.mission.urgent')}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                CATEGORY_TONE[mission.category],
              )}
            >
              {t(`dashboard.category.${mission.category}`)}
            </span>
            <span className="font-mono text-[10px] text-gray-400">
              {mission.publicRef ?? mission.id}
            </span>
            {mission.animalCount > 1 && (
              <span className="text-[10px] text-gray-500">× {mission.animalCount}</span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-bold text-gray-900 truncate">{mission.address}</p>
          <p className="text-[11px] text-gray-500 truncate inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {mission.zone}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
              <span className={cn('size-1.5 rounded-full', statusTone.dot)} />
              {t(`fieldTeam.status.${statusTone.label}`)}
            </span>
            <span className="text-[10px] text-gray-500 inline-flex items-center gap-1">
              <Clock className="size-3" />
              {timeAgo(mission.receivedAt)}
            </span>
          </div>
        </div>
        <div className="grid place-items-center pe-2 text-gray-400">{chevron}</div>
      </div>
    </Link>
  )
}
