import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Inbox,
  Truck,
  CheckCircle2,
  Timer,
  ArrowUpRight,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from 'lucide-react'
import {
  KPI_VALUES,
  HOT_ZONES,
  ACTIVITY_FEED,
  MOCK_REPORTS,
  type ReportCategory,
} from '../data/mockReports'
import { cn } from '@/design-system/cn'

const CATEGORY_TONE: Record<ReportCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

function timeAgo(iso: string) {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

export function Overview() {
  const { t } = useTranslation()
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const pending = MOCK_REPORTS.filter((r) => r.status === 'pending')

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t('dashboard.overview.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">
            {t('dashboard.overview.subtitle', { date: today })}
          </p>
        </div>
        <Link to="/dashboard/triage" className="btn-square btn-square-red">
          <Inbox className="size-4" />
          {t('dashboard.overview.triageQueueAction')}
          <ChevronRight className="size-4 rtl:hidden" />
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t('dashboard.overview.kpi.pendingTriage')}
          value={KPI_VALUES.pendingTriage}
          icon={Inbox}
          tone="urgent"
          delta="+3 depuis hier"
        />
        <KpiCard
          label={t('dashboard.overview.kpi.inProgress')}
          value={KPI_VALUES.inProgress}
          icon={Truck}
          tone="active"
          delta="+5 cette semaine"
        />
        <KpiCard
          label={t('dashboard.overview.kpi.resolvedToday')}
          value={KPI_VALUES.resolvedToday}
          icon={CheckCircle2}
          tone="success"
          delta="objectif 25"
        />
        <KpiCard
          label={t('dashboard.overview.kpi.avgResponse')}
          value={KPI_VALUES.avgResponse}
          icon={Timer}
          tone="neutral"
          delta="-12 min vs sem. dernière"
        />
      </div>

      {/* Two-column: Triage preview (left) + Hot zones / Activity (right) */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Triage preview */}
        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">{t('dashboard.overview.triageQueue')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {pending.length} signalement{pending.length > 1 ? 's' : ''} en attente
              </p>
            </div>
            <Link
              to="/dashboard/triage"
              className="text-sm font-semibold text-olive-700 hover:text-olive-800 inline-flex items-center gap-1"
            >
              {t('dashboard.overview.triageQueueAction')}
              <ArrowUpRight className="size-4 rtl:rotate-90" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-200">
            {pending.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="size-12 rounded-md bg-gray-100 overflow-hidden shrink-0">
                  <img src={r.photoUrl} alt="" className="size-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                        CATEGORY_TONE[r.category],
                      )}
                    >
                      {r.isUrgent && <span className="size-1.5 rounded-full bg-current" />}
                      {t(`dashboard.category.${r.category}`)}
                    </span>
                    <span className="font-mono text-[11px] text-gray-400">{r.id}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{r.address}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {r.zone} · {timeAgo(r.receivedAt)}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <button className="btn-square btn-square-outline h-9 px-3 text-xs">
                    {t('dashboard.triage.card.reject')}
                  </button>
                  <button className="btn-square btn-square-red h-9 px-3 text-xs">
                    {t('dashboard.triage.card.approve')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Hot zones */}
        <section className="bg-white border border-gray-200 rounded-md">
          <div className="border-b border-gray-200 px-5 py-4 flex items-center gap-2">
            <Flame className="size-4 text-red-600" />
            <h2 className="font-bold text-gray-900">{t('dashboard.overview.hotZones')}</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {HOT_ZONES.map((z, i) => (
              <li key={z.name} className="px-5 py-3 flex items-center gap-3">
                <span className="font-mono text-xs text-gray-400 w-5 shrink-0">0{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                  {z.name}
                </span>
                <span className="font-mono text-sm text-gray-700">{z.count}</span>
                <Trend value={z.trend} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Activity feed */}
      <section className="bg-white border border-gray-200 rounded-md">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-bold text-gray-900">{t('dashboard.overview.recentActivity')}</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {ACTIVITY_FEED.map((a, i) => (
            <li key={i} className="px-5 py-3 flex items-start gap-4 text-sm">
              <span className="font-mono text-xs text-gray-400 w-12 shrink-0 mt-0.5">{a.time}</span>
              <span
                className={cn(
                  'size-2 rounded-full mt-2 shrink-0',
                  a.tone === 'urgent' && 'bg-red-500',
                  a.tone === 'success' && 'bg-emerald-500',
                  a.tone === 'normal' && 'bg-olive-500',
                  a.tone === 'muted' && 'bg-gray-400',
                )}
              />
              <p className="text-gray-700 leading-snug">
                <strong className="text-gray-900 font-semibold">{a.who}</strong> {a.what}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

type KpiTone = 'urgent' | 'active' | 'success' | 'neutral'

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  delta,
}: {
  label: string
  value: string | number
  icon: typeof Inbox
  tone: KpiTone
  delta: string
}) {
  const toneStyles: Record<KpiTone, { iconBg: string; iconColor: string; barColor: string }> = {
    urgent: { iconBg: 'bg-red-50', iconColor: 'text-red-600', barColor: 'bg-red-600' },
    active: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600', barColor: 'bg-blue-600' },
    success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', barColor: 'bg-emerald-600' },
    neutral: { iconBg: 'bg-gray-100', iconColor: 'text-gray-600', barColor: 'bg-gray-400' },
  }
  const s = toneStyles[tone]
  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 relative overflow-hidden">
      <div className={cn('absolute top-0 inset-x-0 h-1', s.barColor)} />
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
      <p className="mt-3 text-xs text-gray-500">{delta}</p>
    </div>
  )
}

function Trend({ value }: { value: string }) {
  if (value === '0') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 font-mono w-12 justify-end">
        <Minus className="size-3" /> 0
      </span>
    )
  }
  const isPlus = value.startsWith('+')
  const Icon = isPlus ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-mono w-12 justify-end',
        isPlus ? 'text-red-600' : 'text-emerald-600',
      )}
    >
      <Icon className="size-3" /> {value}
    </span>
  )
}
