import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter as FilterIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { api, ApiError, type ReportStatus as ApiStatus } from '@/lib/api'
import { adaptReports, type Report, type ReportStatus } from '../data/adapter'
import { StatusBadge } from '../components/StatusBadge'
import { CategoryBadge } from '../components/CategoryBadge'
import { ReportDrawer } from '../components/ReportDrawer'
import { cn } from '@/design-system/cn'

/* Maps the dashboard's lowerCamel filter key → the API's UPPERCASE enum. */
const FILTER_TO_API: Record<Exclude<ReportStatus, never>, ApiStatus> = {
  pending: 'PENDING',
  approved: 'APPROVED',
  assigned: 'ASSIGNED',
  inProgress: 'IN_PROGRESS',
  resolved: 'RESOLVED',
  rejected: 'REJECTED',
  impossible: 'IMPOSSIBLE',
}

const STATUS_FILTERS: Array<ReportStatus | 'all'> = [
  'all',
  'pending',
  'approved',
  'assigned',
  'inProgress',
  'resolved',
  'rejected',
]

const PAGE_SIZE = 25

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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ reports: Report[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<ReportStatus | 'all', number>>({
    all: 0,
    pending: 0,
    approved: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    impossible: 0,
  })

  // Debounce the search input by 300 ms.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  // Reset to page 1 when filter / search changes.
  useEffect(() => {
    setPage(1)
  }, [filter, debouncedSearch])

  // Fetch the visible page.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .listReports({
        status: filter === 'all' ? undefined : FILTER_TO_API[filter],
        search: debouncedSearch.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((r) => {
        if (cancelled) return
        setData({ reports: adaptReports(r.reports), total: r.total })
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : t('dashboard.reports.errors.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filter, debouncedSearch, page])

  // Refresh per-status counts (cheap: separate light requests, only when the user is on the page).
  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.listReports({ pageSize: 1 }),
      ...(['PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map(
        (s) => api.listReports({ status: s, pageSize: 1 }),
      ),
    ])
      .then(([all, p, a, asg, ip, r, rj]) => {
        if (cancelled) return
        setCounts({
          all: all.total,
          pending: p.total,
          approved: a.total,
          assigned: asg.total,
          inProgress: ip.total,
          resolved: r.total,
          rejected: rj.total,
          impossible: 0,
        })
      })
      .catch(() => {
        // counts are best-effort
      })
    return () => {
      cancelled = true
    }
  }, [page]) // refresh when the user paginates (cheap)

  const reports = data?.reports ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = (page - 1) * PAGE_SIZE + reports.length

  // Refetch the current page after a drawer mutation (approve / reject / assign).
  function refetchAfterMutation() {
    api
      .listReports({
        status: filter === 'all' ? undefined : FILTER_TO_API[filter],
        search: debouncedSearch.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((r) => setData({ reports: adaptReports(r.reports), total: r.total }))
      .catch(() => {
        /* silent — the drawer already showed any error */
      })
  }

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
            <button
              className="btn-square btn-square-outline"
              disabled
              title={t('dashboard.reports.exportSoon')}
            >
              <Download className="size-4" />
              {t('dashboard.reports.export')}
            </button>
          </div>
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

        {/* Toolbar — filters + search */}
        <div className="bg-white border border-gray-200 rounded-md">
          <div className="flex flex-wrap items-center gap-3 p-3 border-b border-gray-200">
            <div className="inline-flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider gap-1.5 px-2">
              <FilterIcon className="size-3.5" />
              {t('dashboard.reports.filterStatus')}
            </div>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((s) => {
                const count = counts[s]
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
          <div className="overflow-x-auto relative">
            {loading && (
              <div className="absolute inset-0 grid place-items-center bg-white/60 z-10">
                <Loader2 className="size-5 animate-spin text-gray-400" />
              </div>
            )}
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
                {!loading && reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500">
                      {t('dashboard.reports.noResults')}
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
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
                            {t('dashboard.reports.urgentBadge')}
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
                from: showingFrom,
                to: showingTo,
                total,
              })}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-3.5 rtl:rotate-180" />
                {t('dashboard.reports.previous')}
              </button>
              <span className="font-mono text-xs px-2 text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('dashboard.reports.next')}
                <ChevronRight className="size-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportDrawer
        publicRef={selectedId}
        onClose={() => setSelectedId(null)}
        onMutated={refetchAfterMutation}
      />
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
