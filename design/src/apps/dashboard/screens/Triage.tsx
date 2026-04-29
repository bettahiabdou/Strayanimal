import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Eye, MapPin, Clock, User } from 'lucide-react'
import { MOCK_REPORTS, type Report, type ReportCategory } from '../data/mockReports'
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

type Filter = 'all' | 'urgent' | 'today'

export function Triage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  const all = useMemo(
    () => MOCK_REPORTS.filter((r) => r.status === 'pending' && !removed.has(r.id)),
    [removed],
  )
  const visible = useMemo(() => {
    if (filter === 'urgent') return all.filter((r) => r.isUrgent)
    if (filter === 'today') {
      const today = new Date().toDateString()
      return all.filter((r) => new Date(r.receivedAt).toDateString() === today)
    }
    return all
  }, [all, filter])

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t('dashboard.triage.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">
            {t('dashboard.triage.subtitle')} — <span className="font-mono">{visible.length}</span>{' '}
            en file
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-md inline-flex p-1">
        {(['all', 'urgent', 'today'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded text-sm font-semibold transition-colors',
              filter === f ? 'bg-olive-700 text-white' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {t(`dashboard.triage.filters.${f}`)}
          </button>
        ))}
      </div>

      {/* Grid of triage cards */}
      {visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-16 text-center">
          <p className="text-gray-500">{t('dashboard.triage.empty')}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {visible.map((r) => (
            <TriageCard
              key={r.id}
              report={r}
              onApprove={() => setRemoved((s) => new Set(s).add(r.id))}
              onReject={() => setRemoved((s) => new Set(s).add(r.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TriageCard({
  report,
  onApprove,
  onReject,
}: {
  report: Report
  onApprove: () => void
  onReject: () => void
}) {
  const { t } = useTranslation()
  return (
    <article
      className={cn(
        'bg-white border rounded-md overflow-hidden flex',
        report.isUrgent ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200',
      )}
    >
      <div className="size-32 md:size-40 bg-gray-100 shrink-0 relative">
        <img src={report.photoUrl} alt="" className="size-full object-cover" loading="lazy" />
        {report.isUrgent && (
          <span className="absolute top-2 start-2 inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            Urgent
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                  CATEGORY_TONE[report.category],
                )}
              >
                {t(`dashboard.category.${report.category}`)}
              </span>
              <span className="font-mono text-[11px] text-gray-400">{report.id}</span>
              {report.animalCount > 1 && (
                <span className="text-[11px] text-gray-500">× {report.animalCount}</span>
              )}
            </div>
            <p className="mt-2 text-[13px] font-semibold text-gray-900 truncate">
              {report.address}
            </p>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              <MapPin className="size-3" /> {report.zone}
              <span className="text-gray-300">·</span>
              <Clock className="size-3" /> {timeAgo(report.receivedAt)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-[13px] text-gray-700 line-clamp-2 leading-snug">{report.comment}</p>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1 truncate">
            <User className="size-3" />
            {report.reporter.name ?? 'Anonyme'}
          </span>
          <div className="flex gap-1.5">
            <button
              className="btn-square btn-square-outline h-8 px-2.5 text-xs"
              aria-label={t('dashboard.triage.card.viewDetail')}
            >
              <Eye className="size-3.5" />
            </button>
            <button onClick={onReject} className="btn-square btn-square-outline h-8 px-3 text-xs">
              <X className="size-3.5" />
              {t('dashboard.triage.card.reject')}
            </button>
            <button onClick={onApprove} className="btn-square btn-square-red h-8 px-3 text-xs">
              <Check className="size-3.5" />
              {t('dashboard.triage.card.approve')}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
