import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
  Timer,
  XCircle,
  Award,
} from 'lucide-react'
import {
  KPI,
  VOLUME_30D,
  RESPONSE_30D,
  CATEGORY_STATS,
  ZONE_STATS,
  TEAM_STATS,
} from '../data/mockStats'
import { LineChart } from '../components/charts/LineChart'
import { Donut } from '../components/charts/Donut'
import { CategoryBadge } from '../components/CategoryBadge'
import { cn } from '@/design-system/cn'

type Range = 'week' | 'month' | 'quarter' | 'year'

export function Stats() {
  const { t } = useTranslation()
  const [range, setRange] = useState<Range>('month')

  const total = CATEGORY_STATS.reduce((s, x) => s + x.count, 0)
  const slices = CATEGORY_STATS.map((c) => ({
    label: t(`dashboard.category.${c.category}`),
    value: c.count,
    color:
      c.category === 'aggressive' ? '#dc2626' : c.category === 'injured' ? '#f97316' : '#eab308',
  }))

  const zoneMax = Math.max(...ZONE_STATS.map((z) => z.count))
  const peakDate = new Date(KPI.peakDay.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t('dashboard.stats.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.stats.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-md inline-flex p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
                  range === r ? 'bg-olive-700 text-white' : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {t(`dashboard.stats.range.${r}`)}
              </button>
            ))}
          </div>
          <button className="btn-square btn-square-outline">
            <Download className="size-4" />
            {t('dashboard.stats.export')}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t('dashboard.stats.kpi.totalReports')}
          value={KPI.totalReports}
          delta={KPI.totalDelta}
          icon={FileText}
          tone="neutral"
        />
        <KpiCard
          label={t('dashboard.stats.kpi.resolved')}
          value={`${KPI.resolutionRate}%`}
          delta={KPI.resolutionDelta}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label={t('dashboard.stats.kpi.avgResponse')}
          value={KPI.avgResponse}
          delta={KPI.avgResponseDelta}
          deltaInverted
          icon={Timer}
          tone="active"
        />
        <KpiCard
          label={t('dashboard.stats.kpi.rejected')}
          value={KPI.rejected}
          delta={KPI.rejectedDelta}
          deltaInverted
          icon={XCircle}
          tone="muted"
        />
      </div>

      {/* Volume + Response time */}
      <div className="grid lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">{t('dashboard.stats.volumeTitle')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.stats.volumeSubtitle')}</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-gray-500 inline-flex items-center gap-1.5 justify-end">
                <Award className="size-3.5 text-amber-500" />
                {t('dashboard.stats.peakDay')}
              </p>
              <p className="font-mono font-semibold text-gray-900 mt-0.5">
                {peakDate} · {KPI.peakDay.count}
              </p>
            </div>
          </div>
          <div className="p-5">
            <LineChart data={VOLUME_30D} stroke="var(--color-olive-600)" height={220} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-md">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-bold text-gray-900">{t('dashboard.stats.responseTimeTitle')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('dashboard.stats.responseTimeSubtitle')}
            </p>
          </div>
          <div className="p-5">
            <p className="font-mono text-3xl font-bold text-gray-900">{KPI.avgResponse}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingDown className="size-3.5" />
              {Math.abs(KPI.avgResponseDelta)}% plus rapide
            </p>
            <div className="mt-4">
              <LineChart
                data={RESPONSE_30D}
                stroke="#3b82f6"
                height={140}
                showAxis={false}
                formatY={(n) => `${n} min`}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Category donut + Zone bars */}
      <div className="grid lg:grid-cols-3 gap-4">
        <section className="bg-white border border-gray-200 rounded-md">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-bold text-gray-900">{t('dashboard.stats.categoryTitle')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{total} signalements</p>
          </div>
          <div className="p-5 flex flex-col items-center">
            <Donut
              slices={slices}
              centerValue={String(total)}
              centerLabel="Total"
              size={180}
              thickness={22}
            />
            <ul className="mt-5 w-full space-y-2">
              {CATEGORY_STATS.map((c) => {
                const pct = ((c.count / total) * 100).toFixed(0)
                return (
                  <li key={c.category} className="flex items-center gap-3 text-sm">
                    <CategoryBadge category={c.category} />
                    <span className="flex-1" />
                    <span className="font-mono text-gray-700 font-semibold">{c.count}</span>
                    <span className="font-mono text-xs text-gray-500 w-10 text-end">{pct}%</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-md">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-bold text-gray-900">{t('dashboard.stats.zoneTitle')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Top {ZONE_STATS.length} quartiers les plus actifs
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {ZONE_STATS.map((z) => {
              const pct = (z.count / zoneMax) * 100
              return (
                <li key={z.name} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-800 w-40 truncate">
                    {z.name}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded h-2 overflow-hidden">
                    <div className="h-full bg-olive-600 rounded" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-sm text-gray-900 font-semibold w-12 text-end">
                    {z.count}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* Team performance */}
      <section className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-bold text-gray-900">{t('dashboard.stats.teamTitle')}</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              <th className="text-start px-5 py-2">{t('dashboard.stats.team.name')}</th>
              <th className="text-end px-3 py-2">{t('dashboard.stats.team.missions')}</th>
              <th className="text-end px-3 py-2">{t('dashboard.stats.team.resolved')}</th>
              <th className="text-start px-3 py-2 w-40">{t('dashboard.stats.team.rate')}</th>
              <th className="text-end px-5 py-2">{t('dashboard.stats.team.avgResponse')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TEAM_STATS.map((tm) => {
              const rate = (tm.resolved / tm.missions) * 100
              return (
                <tr key={tm.team} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-900">{tm.team}</td>
                  <td className="px-3 py-3 text-end font-mono text-gray-700">{tm.missions}</td>
                  <td className="px-3 py-3 text-end font-mono text-gray-700">{tm.resolved}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded h-1.5 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded',
                            rate > 90
                              ? 'bg-emerald-500'
                              : rate > 80
                                ? 'bg-olive-500'
                                : 'bg-amber-500',
                          )}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-gray-700 w-10 text-end">
                        {rate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-end font-mono text-gray-700">{tm.avgResponse}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

type KpiTone = 'neutral' | 'success' | 'active' | 'muted'

function KpiCard({
  label,
  value,
  delta,
  deltaInverted,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  delta: number
  deltaInverted?: boolean
  icon: typeof FileText
  tone: KpiTone
}) {
  const styles: Record<KpiTone, { iconBg: string; iconColor: string; bar: string }> = {
    neutral: { iconBg: 'bg-olive-50', iconColor: 'text-olive-700', bar: 'bg-olive-600' },
    success: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', bar: 'bg-emerald-500' },
    active: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600', bar: 'bg-blue-500' },
    muted: { iconBg: 'bg-gray-100', iconColor: 'text-gray-500', bar: 'bg-gray-400' },
  }
  const s = styles[tone]
  // Determine if delta represents improvement
  const isPositive = deltaInverted ? delta < 0 : delta > 0
  const isFlat = delta === 0
  const TrendIcon = delta < 0 ? TrendingDown : TrendingUp

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
      {!isFlat && (
        <p
          className={cn(
            'mt-3 text-xs font-semibold inline-flex items-center gap-1',
            isPositive ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          <TrendIcon className="size-3.5" />
          {delta > 0 ? '+' : ''}
          {delta}%<span className="text-gray-500 font-normal ms-1">vs période préc.</span>
        </p>
      )}
    </div>
  )
}
