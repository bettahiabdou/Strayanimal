import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Inbox,
  Truck,
  CheckCircle2,
  Timer,
  ArrowUpRight,
  Flame,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { api, type ReportStats, ApiError } from '@/lib/api'
import { adaptReports, type Report, type ReportCategory } from '../data/adapter'
import { cn } from '@/design-system/cn'

const CATEGORY_TONE: Record<ReportCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

/** Localised "il y a X min/h/j" — keys live under common.timeAgo. */
function useTimeAgo() {
  const { t } = useTranslation()
  return (iso: string) => {
    const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (diffMin < 1) return t('common.timeAgo.justNow')
    if (diffMin < 60) return t('common.timeAgo.minutes', { count: diffMin })
    const h = Math.floor(diffMin / 60)
    if (h < 24) return t('common.timeAgo.hours', { count: h })
    return t('common.timeAgo.days', { count: Math.floor(h / 24) })
  }
}

function fmtMin(n: number | null) {
  if (n == null) return '—'
  const h = Math.floor(n / 60)
  const m = n % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}` : `${m} min`
}

/**
 * AuditEvent.action → i18n key under dashboard.overview.activity.*.
 * Returns null for unknown actions (caller falls back to the raw action).
 */
const ACTION_TO_KEY: Record<string, string> = {
  'report.submit': 'dashboard.overview.activity.report.submit',
  'report.approve': 'dashboard.overview.activity.report.approve',
  'report.reject': 'dashboard.overview.activity.report.reject',
  'report.assign': 'dashboard.overview.activity.report.assign',
  'login.success': 'dashboard.overview.activity.auth.login',
  'login.failed': 'dashboard.overview.activity.auth.loginFail',
  'login.blocked': 'dashboard.overview.activity.auth.loginBlocked',
  logout: 'dashboard.overview.activity.auth.logout',
}

export function Overview() {
  const { t, i18n } = useTranslation()
  const timeAgo = useTimeAgo()
  const today = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const [stats, setStats] = useState<ReportStats | null>(null)
  const [pending, setPending] = useState<Report[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all([api.reportStats(), api.listReports({ status: 'PENDING', pageSize: 5, page: 1 })])
      .then(([s, l]) => {
        if (cancelled) return
        setStats(s.stats)
        setPending(adaptReports(l.reports))
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : t('common.errors.network'))
      })
    return () => {
      cancelled = true
    }
  }, [])

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

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm"
        >
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t('dashboard.overview.kpi.pendingTriage')}
          value={stats?.pendingTriage ?? '—'}
          icon={Inbox}
          tone="urgent"
          loading={!stats && !error}
        />
        <KpiCard
          label={t('dashboard.overview.kpi.inProgress')}
          value={stats?.inProgress ?? '—'}
          icon={Truck}
          tone="active"
          loading={!stats && !error}
        />
        <KpiCard
          label={t('dashboard.overview.kpi.resolvedToday')}
          value={stats?.resolvedToday ?? '—'}
          icon={CheckCircle2}
          tone="success"
          loading={!stats && !error}
        />
        <KpiCard
          label={t('dashboard.overview.kpi.avgResponse')}
          value={stats ? fmtMin(stats.avgResponseMinutes) : '—'}
          icon={Timer}
          tone="neutral"
          loading={!stats && !error}
        />
      </div>

      {/* Two-column: Triage preview (left) + Hot zones (right) */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Triage preview */}
        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">{t('dashboard.overview.triageQueue')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {pending ? t('dashboard.overview.pendingHeader', { count: pending.length }) : '…'}
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
          {!pending ? (
            <div className="p-10 grid place-items-center text-gray-400">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">
              {t('dashboard.overview.empty.triage')}
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pending.slice(0, 5).map((r) => (
                <li
                  key={r.id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="size-12 rounded-md bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={r.photoUrl}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
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
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Hot zones */}
        <section className="bg-white border border-gray-200 rounded-md">
          <div className="border-b border-gray-200 px-5 py-4 flex items-center gap-2">
            <Flame className="size-4 text-red-600" />
            <h2 className="font-bold text-gray-900">{t('dashboard.overview.hotZones')}</h2>
          </div>
          {!stats ? (
            <div className="p-10 grid place-items-center text-gray-400">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : stats.hotZones.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">
              {t('dashboard.overview.empty.activityWeek')}
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {stats.hotZones.map((z, i) => (
                <li key={z.zone} className="px-5 py-3 flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-400 w-5 shrink-0">0{i + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                    {z.zone}
                  </span>
                  <span className="font-mono text-sm text-gray-700">{z.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Activity feed */}
      <section className="bg-white border border-gray-200 rounded-md">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-bold text-gray-900">{t('dashboard.overview.recentActivity')}</h2>
        </div>
        {!stats ? (
          <div className="p-10 grid place-items-center text-gray-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : stats.recentActivity.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">
            {t('dashboard.overview.empty.activityRecent')}
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {stats.recentActivity.map((a) => {
              const time = new Date(a.at).toLocaleTimeString(
                i18n.language === 'ar' ? 'ar-MA' : 'fr-FR',
                { hour: '2-digit', minute: '2-digit' },
              )
              const tone =
                a.action === 'login.failed' || a.action === 'report.submit'
                  ? 'urgent'
                  : a.action === 'report.resolve' || a.action.endsWith('.success')
                    ? 'success'
                    : a.action === 'report.reject' || a.action === 'logout'
                      ? 'muted'
                      : 'normal'
              const key = ACTION_TO_KEY[a.action]
              // The localised activity strings already include the user's name
              // via {{who}}, plus the report ref where useful via {{target}}.
              const what = key ? t(key, { who: a.who, target: a.target ?? '' }) : a.action
              return (
                <li key={a.id} className="px-5 py-3 flex items-start gap-4 text-sm">
                  <span className="font-mono text-xs text-gray-400 w-12 shrink-0 mt-0.5">
                    {time}
                  </span>
                  <span
                    className={cn(
                      'size-2 rounded-full mt-2 shrink-0',
                      tone === 'urgent' && 'bg-red-500',
                      tone === 'success' && 'bg-emerald-500',
                      tone === 'normal' && 'bg-olive-500',
                      tone === 'muted' && 'bg-gray-400',
                    )}
                  />
                  <p className="text-gray-700 leading-snug">{what}</p>
                </li>
              )
            })}
          </ul>
        )}
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
  loading,
}: {
  label: string
  value: string | number
  icon: typeof Inbox
  tone: KpiTone
  loading?: boolean
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
          <p className="mt-3 font-mono text-3xl font-bold text-gray-900 tracking-tight">
            {loading ? <Loader2 className="size-6 animate-spin text-gray-300" /> : value}
          </p>
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
