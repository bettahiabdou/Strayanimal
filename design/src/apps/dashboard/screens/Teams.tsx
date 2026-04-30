import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Users,
  CheckCircle2,
  Truck,
  PauseCircle,
  Clock,
  Edit3,
  MoreHorizontal,
  MapPin,
  Crown,
  Activity,
} from 'lucide-react'
import { MOCK_TEAMS, type FieldTeam, type TeamStatus } from '../data/mockTeams'
import { cn } from '@/design-system/cn'

const STATUS_TONE: Record<TeamStatus, { dot: string; pill: string }> = {
  available: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  enRoute: { dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  onSite: { dot: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 border-orange-200' },
  off: { dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function avatarColor(name: string) {
  const colors = [
    'bg-olive-600',
    'bg-blue-600',
    'bg-orange-500',
    'bg-rose-600',
    'bg-violet-600',
    'bg-emerald-600',
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return colors[h % colors.length]
}

function useTimeAgo() {
  const { t } = useTranslation()
  return (iso: string) => {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (diff < 60) return t('common.timeAgo.minutes', { count: diff })
    return t('common.timeAgo.hours', { count: Math.floor(diff / 60) })
  }
}

type Filter = 'all' | TeamStatus

export function Teams() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(() => {
    if (filter === 'all') return MOCK_TEAMS
    return MOCK_TEAMS.filter((tt) => tt.status === filter)
  }, [filter])

  const stats = useMemo(
    () => ({
      total: MOCK_TEAMS.length,
      available: MOCK_TEAMS.filter((tt) => tt.status === 'available').length,
      onMission: MOCK_TEAMS.filter((tt) => tt.status === 'enRoute' || tt.status === 'onSite')
        .length,
      off: MOCK_TEAMS.filter((tt) => tt.status === 'off').length,
    }),
    [],
  )

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t('dashboard.teams.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.teams.subtitle')}</p>
        </div>
        <button className="btn-square btn-square-red">
          <Plus className="size-4" />
          {t('dashboard.teams.newTeam')}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t('dashboard.teams.kpi.total')}
          value={stats.total}
          icon={Users}
          tone="neutral"
        />
        <KpiCard
          label={t('dashboard.teams.kpi.available')}
          value={stats.available}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label={t('dashboard.teams.kpi.onMission')}
          value={stats.onMission}
          icon={Truck}
          tone="active"
        />
        <KpiCard
          label={t('dashboard.teams.kpi.off')}
          value={stats.off}
          icon={PauseCircle}
          tone="muted"
        />
      </div>

      {/* Filter pills */}
      <div className="bg-white border border-gray-200 rounded-md inline-flex p-1">
        {(['all', 'available', 'enRoute', 'onSite', 'off'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
              filter === f ? 'bg-olive-700 text-white' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {f === 'all' ? t('dashboard.teams.filterAll') : t(`dashboard.teams.status.${f}`)}
          </button>
        ))}
      </div>

      {/* Team grid */}
      {visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-16 text-center">
          <p className="text-gray-500">{t('dashboard.teams.card.noTeams')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}

function TeamCard({ team }: { team: FieldTeam }) {
  const { t } = useTranslation()
  const timeAgo = useTimeAgo()
  const tone = STATUS_TONE[team.status]
  return (
    <article className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">{team.name}</h3>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                tone.pill,
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  tone.dot,
                  team.status === 'enRoute' || team.status === 'onSite' ? 'animate-pulse' : '',
                )}
              />
              {t(`dashboard.teams.status.${team.status}`)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {team.zone}
          </p>
        </div>
        <button
          aria-label={t('dashboard.teams.card.moreActions')}
          className="size-8 rounded-md hover:bg-gray-100 grid place-items-center text-gray-500"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Members */}
      <div className="px-5 py-4 border-b border-gray-200">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
          {t('dashboard.teams.card.members')} · {team.members.length}
        </p>
        <ul className="space-y-2">
          {team.members.map((m) => (
            <li key={m.name} className="flex items-center gap-3">
              <div
                className={cn(
                  'size-8 rounded-full grid place-items-center text-white text-xs font-bold shrink-0',
                  avatarColor(m.name),
                )}
              >
                {initials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{m.name}</p>
              </div>
              {m.role === 'lead' && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  <Crown className="size-3" />
                  {t('dashboard.teams.card.lead')}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200">
        <Stat label={t('dashboard.teams.card.missionsToday')} value={team.todayMissions} />
        <Stat label={t('dashboard.teams.card.resolved')} value={team.todayResolved} />
        <Stat label={t('dashboard.teams.card.avgResponse')} value={team.avgResponse} />
      </div>

      {/* Current mission (if any) */}
      {team.currentMission ? (
        <div className="bg-orange-50 border-t-2 border-orange-300 px-5 py-3">
          <p className="text-[10px] uppercase tracking-wider text-orange-700 font-bold inline-flex items-center gap-1.5">
            <Activity className="size-3 animate-pulse" />
            {t('dashboard.teams.card.currentMission')}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 truncate">
            <span className="font-mono text-xs text-gray-500 me-2">
              {team.currentMission.reportId}
            </span>
            {team.currentMission.address}
          </p>
          <p className="text-[11px] text-orange-700 mt-0.5 inline-flex items-center gap-1">
            <Clock className="size-3" />{' '}
            {t('dashboard.teams.card.startedAt', {
              when: timeAgo(team.currentMission.startedAt),
            })}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 px-5 py-3 text-xs text-gray-500">
          {team.status === 'off' ? t('dashboard.teams.card.off') : t('dashboard.teams.card.idle')}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs text-gray-500">
          {team.weekMissions} {t('dashboard.teams.card.weekMissions').toLowerCase()}
        </span>
        <div className="flex gap-1.5">
          <button className="btn-square btn-square-outline h-8 px-2.5 text-xs">
            <Edit3 className="size-3.5" />
            {t('dashboard.teams.card.edit')}
          </button>
          <button className="btn-square btn-square-olive h-8 px-3 text-xs">
            {t('dashboard.teams.card.viewDetail')}
          </button>
        </div>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-4 py-3">
      <p className="font-mono text-xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="mt-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
        {label}
      </p>
    </div>
  )
}

type KpiTone = 'success' | 'active' | 'neutral' | 'muted'

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Users
  tone: KpiTone
}) {
  const styles: Record<KpiTone, { iconBg: string; iconColor: string; bar: string }> = {
    success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', bar: 'bg-emerald-600' },
    active: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600', bar: 'bg-blue-600' },
    neutral: { iconBg: 'bg-olive-50', iconColor: 'text-olive-700', bar: 'bg-olive-600' },
    muted: { iconBg: 'bg-gray-100', iconColor: 'text-gray-500', bar: 'bg-gray-400' },
  }
  const s = styles[tone]
  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 relative overflow-hidden">
      <div className={cn('absolute top-0 inset-x-0 h-1', s.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
          <p className="mt-3 font-mono text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            'size-10 rounded-md grid place-items-center shrink-0',
            s.iconBg,
            s.iconColor,
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
