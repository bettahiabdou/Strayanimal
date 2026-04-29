import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Clock, Truck, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  MOCK_MISSIONS,
  type Mission,
  type MissionCategory,
  type MissionStatus,
} from '../data/mockMissions'
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

function timeAgo(iso: string) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "à l'instant"
  if (diff < 60) return `il y a ${diff} min`
  return `il y a ${Math.floor(diff / 60)}h`
}

type Filter = 'all' | 'urgent' | 'enRoute'

export function Inbox() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const Chevron = i18n.dir() === 'rtl' ? ChevronLeft : ChevronRight

  const visible = useMemo(() => {
    let rows = [...MOCK_MISSIONS]
    if (filter === 'urgent') rows = rows.filter((m) => m.isUrgent)
    if (filter === 'enRoute')
      rows = rows.filter((m) => m.status === 'enRoute' || m.status === 'onSite')
    // Sort: urgent first, then enRoute, then assigned
    return rows.sort((a, b) => {
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
  }, [filter])

  const newCount = MOCK_MISSIONS.filter((m) => m.status === 'assigned').length

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

      {/* List */}
      {visible.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <Truck className="size-10 text-gray-300 mx-auto" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-gray-700">{t('fieldTeam.inbox.empty')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('fieldTeam.inbox.emptySubtitle')}</p>
        </div>
      ) : (
        <ul className="px-5 space-y-3">
          {visible.map((m) => (
            <li key={m.id}>
              <MissionCard mission={m} chevron={<Chevron className="size-4" />} t={t} />
            </li>
          ))}
        </ul>
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
            <span className="font-mono text-[10px] text-gray-400">{mission.id}</span>
            {mission.animalCount > 1 && (
              <span className="text-[10px] text-gray-500">× {mission.animalCount}</span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-bold text-gray-900 truncate">{mission.address}</p>
          <p className="text-[11px] text-gray-500 truncate inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {mission.zone} · {mission.distanceKm} km
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
