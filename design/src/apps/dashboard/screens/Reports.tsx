import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter as FilterIcon,
} from 'lucide-react'
import { MOCK_REPORTS, type Report, type ReportStatus } from '../data/mockReports'
import { StatusBadge } from '../components/StatusBadge'
import { CategoryBadge } from '../components/CategoryBadge'
import { ReportDrawer } from '../components/ReportDrawer'
import { cn } from '@/design-system/cn'

const STATUS_FILTERS: Array<ReportStatus | 'all'> = [
  'all',
  'pending',
  'approved',
  'assigned',
  'inProgress',
  'resolved',
  'rejected',
]

function fmtShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Reports() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let rows: Report[] = MOCK_REPORTS
    if (filter !== 'all') rows = rows.filter((r) => r.status === filter)
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      rows = rows.filter(
        (r) =>
          r.id.toLowerCase().includes(s) ||
          r.address.toLowerCase().includes(s) ||
          r.zone.toLowerCase().includes(s) ||
          (r.team ?? '').toLowerCase().includes(s),
      )
    }
    return rows
  }, [filter, search])

  const selected = filtered.find((r) => r.id === selectedId) ?? null

  return (
    <>
      <div className="space-y-6 max-w-[1400px]">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {t('dashboard.reports.title')}
            </h1>
            <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.reports.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-square btn-square-outline">
              <Download className="size-4" />
              {t('dashboard.reports.export')}
            </button>
          </div>
        </div>

        {/* Toolbar — filters + search */}
        <div className="bg-white border border-gray-200 rounded-md">
          <div className="flex flex-wrap items-center gap-3 p-3 border-b border-gray-200">
            <div className="inline-flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider gap-1.5 px-2">
              <FilterIcon className="size-3.5" />
              {t('dashboard.reports.filterStatus')}
            </div>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((s) => {
                const count =
                  s === 'all'
                    ? MOCK_REPORTS.length
                    : MOCK_REPORTS.filter((r) => r.status === s).length
                const label =
                  s === 'all' ? t('dashboard.reports.filterAll') : t(`dashboard.status.${s}`)
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors',
                      filter === s ? 'bg-olive-700 text-white' : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        'font-mono px-1 rounded text-[10px]',
                        filter === s ? 'bg-white/20' : 'bg-gray-200 text-gray-700',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="ms-auto relative w-full md:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('dashboard.reports.search')}
                className="w-full bg-white border border-gray-200 rounded-md ps-9 pe-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-500/20 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  <Th className="w-16">{t('dashboard.reports.columns.photo')}</Th>
                  <Th sortable>{t('dashboard.reports.columns.id')}</Th>
                  <Th>{t('dashboard.reports.columns.category')}</Th>
                  <Th>{t('dashboard.reports.columns.location')}</Th>
                  <Th>{t('dashboard.reports.columns.status')}</Th>
                  <Th>{t('dashboard.reports.columns.agent')}</Th>
                  <Th>{t('dashboard.reports.columns.team')}</Th>
                  <Th sortable>{t('dashboard.reports.columns.received')}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500">
                      {t('dashboard.reports.noResults')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        'cursor-pointer hover:bg-gray-50 transition-colors',
                        r.isUrgent && 'bg-red-50/40',
                      )}
                    >
                      <td className="ps-4 py-3">
                        <div className="size-10 rounded bg-gray-100 overflow-hidden">
                          <img
                            src={r.photoUrl}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="font-mono text-xs text-gray-700 font-semibold">
                          {r.id}
                        </span>
                        {r.isUrgent && (
                          <span className="ms-2 inline-flex items-center text-[9px] font-bold uppercase text-red-600">
                            ● Urgent
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <CategoryBadge category={r.category} />
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="leading-tight">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{r.address}</p>
                          <p className="text-xs text-gray-500">{r.zone}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-3 align-middle text-gray-700 text-xs">
                        {r.agent ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-3 align-middle text-gray-700 text-xs">
                        {r.team ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-3 pe-4 align-middle font-mono text-xs text-gray-600 whitespace-nowrap">
                        {fmtShort(r.receivedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm">
            <p className="text-xs text-gray-500">
              {t('dashboard.reports.showing', {
                from: filtered.length === 0 ? 0 : 1,
                to: filtered.length,
                total: MOCK_REPORTS.length,
              })}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-3.5 rtl:rotate-180" />
                {t('dashboard.reports.previous')}
              </button>
              <span className="font-mono text-xs px-2 text-gray-700">1 / 1</span>
              <button
                disabled
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('dashboard.reports.next')}
                <ChevronRight className="size-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportDrawer report={selected} onClose={() => setSelectedId(null)} />
    </>
  )
}

function Th({
  children,
  sortable,
  className,
}: {
  children: React.ReactNode
  sortable?: boolean
  className?: string
}) {
  return (
    <th className={cn('text-start px-3 py-2 first:ps-4 last:pe-4 whitespace-nowrap', className)}>
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sortable && <ArrowUpDown className="size-3 text-gray-400" />}
      </span>
    </th>
  )
}
