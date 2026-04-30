import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  MapPin,
  Clock,
  User,
  Loader2,
  AlertCircle,
  RefreshCcw,
  X,
  Check,
  Send,
  Users as UsersIcon,
} from 'lucide-react'
import { api, ApiError, type ApiTeam } from '@/lib/api'
import { adaptReports, type Report, type ReportCategory } from '../data/adapter'
import { ReportDrawer } from '../components/ReportDrawer'
import { cn } from '@/design-system/cn'

const CATEGORY_TONE: Record<ReportCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

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

type Filter = 'all' | 'urgent' | 'today'

export function Triage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [reports, setReports] = useState<Report[] | null>(null)
  const [teams, setTeams] = useState<ApiTeam[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [openRef, setOpenRef] = useState<string | null>(null)

  async function load() {
    setError(null)
    setRefreshing(true)
    try {
      const r = await api.listReports({ status: 'PENDING', pageSize: 100 })
      setReports(adaptReports(r.reports))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.errors.network'))
    } finally {
      setRefreshing(false)
    }
  }

  // Load reports + teams once on mount. Teams are passed to every card so the
  // inline "Valider et assigner" form can populate its dropdown without
  // refetching N times.
  useEffect(() => {
    load()
    api
      .listTeams()
      .then((r) => setTeams(r.teams))
      .catch(() => setTeams([])) // teams are best-effort; cards fall back to approve-only
  }, [])

  /**
   * Optimistic remove: hide the card from local state immediately on
   * approve/reject. Refetch in the background so the badge counts catch up.
   */
  function removeLocal(id: string) {
    setReports((cur) => (cur ? cur.filter((r) => r.id !== id) : cur))
    // Refetch silently in the background so counts/badges match server truth.
    setTimeout(load, 600)
  }

  const visible = useMemo(() => {
    if (!reports) return []
    if (filter === 'urgent') return reports.filter((r) => r.isUrgent)
    if (filter === 'today') {
      const today = new Date().toDateString()
      return reports.filter((r) => new Date(r.receivedAt).toDateString() === today)
    }
    return reports
  }, [reports, filter])

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t('dashboard.triage.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">
            {t('dashboard.triage.subtitle')} —{' '}
            {t('dashboard.triage.card.queueCount', { count: visible.length })}
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="btn-square btn-square-outline"
          aria-label={t('common.actions.refresh')}
        >
          <RefreshCcw className={cn('size-4', refreshing && 'animate-spin')} />
          {t('common.actions.refresh')}
        </button>
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

      {/* Body */}
      {!reports ? (
        <div className="bg-white border border-gray-200 rounded-md p-16 grid place-items-center text-gray-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-16 text-center">
          <p className="text-gray-500">{t('dashboard.triage.empty')}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {visible.map((r) => (
            <TriageCard
              key={r.id}
              report={r}
              teams={teams}
              onDone={() => removeLocal(r.id)}
              onOpen={() => setOpenRef(r.id)}
            />
          ))}
        </div>
      )}

      <ReportDrawer
        publicRef={openRef}
        onClose={() => setOpenRef(null)}
        onMutated={() => {
          // The user acted from the drawer — drop the card from the triage queue
          // immediately, then silently refresh counts.
          if (openRef) removeLocal(openRef)
        }}
      />
    </div>
  )
}

/* ─────────────────────── Triage card ─────────────────────── */

type FormMode = 'idle' | 'rejecting' | 'approving'

type CardState =
  | { kind: 'idle' }
  | { kind: 'rejecting' }
  | { kind: 'approving' }
  | { kind: 'submitting'; previous: 'rejecting' | 'approving' }
  | { kind: 'error'; message: string; previous: FormMode }

function TriageCard({
  report,
  teams,
  onDone,
  onOpen,
}: {
  report: Report
  /** `null` while teams are still loading. Empty array if the request failed. */
  teams: ApiTeam[] | null
  onDone: () => void
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const timeAgo = useTimeAgo()
  const [state, setState] = useState<CardState>({ kind: 'idle' })
  const [reason, setReason] = useState('')
  const [teamId, setTeamId] = useState('')
  const [agentNote, setAgentNote] = useState('')

  /* ─────────── Reject ─────────── */
  async function handleReject() {
    if (!reason.trim()) {
      setState({
        kind: 'error',
        message: t('dashboard.triage.errors.rejectReasonRequired'),
        previous: 'rejecting',
      })
      return
    }
    setState({ kind: 'submitting', previous: 'rejecting' })
    try {
      await api.rejectReport(report.id, reason.trim())
      onDone()
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof ApiError ? e.message : t('dashboard.triage.errors.rejectFailed'),
        previous: 'rejecting',
      })
    }
  }

  /* ─────────── Approve only (no team picked yet) ─────────── */
  async function handleApproveOnly() {
    setState({ kind: 'submitting', previous: 'approving' })
    try {
      await api.approveReport(report.id)
      onDone()
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof ApiError ? e.message : t('dashboard.triage.errors.approveFailed'),
        previous: 'approving',
      })
    }
  }

  /* ─────────── Approve + Assign (chained) ───────────
   *
   * If approve succeeds but assign fails, the report is left in APPROVED
   * state — the agent gets the error and can finish from the drawer
   * (status filter "Approuvés" → row → Assign).
   */
  async function handleApproveAndAssign() {
    if (!teamId) {
      setState({
        kind: 'error',
        message: t('dashboard.triage.errors.teamRequired'),
        previous: 'approving',
      })
      return
    }
    setState({ kind: 'submitting', previous: 'approving' })
    try {
      await api.approveReport(report.id)
      await api.assignReport(report.id, teamId, agentNote.trim() || undefined)
      onDone()
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof ApiError ? e.message : t('dashboard.triage.errors.submitFailed'),
        previous: 'approving',
      })
    }
  }

  const submitting = state.kind === 'submitting'
  const formMode: FormMode =
    state.kind === 'rejecting' || state.kind === 'approving'
      ? state.kind
      : state.kind === 'submitting'
        ? state.previous
        : state.kind === 'error'
          ? state.previous
          : 'idle'
  const errorMsg = state.kind === 'error' ? state.message : null

  return (
    <article
      className={cn(
        // `min-w-0` is critical: without it the grid column auto-grows to fit
        // the widest child (long select option, long button label), distorting
        // all sibling cards. With it, the column stays at 1fr and the inner
        // content is forced to wrap / truncate.
        'bg-white border rounded-md overflow-hidden flex min-w-0',
        report.isUrgent ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200',
      )}
    >
      <div className="w-32 md:w-40 self-stretch bg-gray-100 shrink-0 relative">
        <img src={report.photoUrl} alt="" className="size-full object-cover" loading="lazy" />
        {report.isUrgent && (
          <span className="absolute top-2 start-2 inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            {t('dashboard.triage.card.urgentBadge')}
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

        {/* Inline reject reason form */}
        {formMode === 'rejecting' && (
          <div className="mt-3 p-3 bg-red-50/60 border border-red-200 rounded-md">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider text-red-800 font-semibold mb-1.5">
                {t('dashboard.triage.rejectForm.heading')}
              </span>
              <textarea
                className="textarea text-sm"
                rows={2}
                style={{ minHeight: '3.5rem' }}
                placeholder={t('dashboard.triage.rejectForm.placeholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </label>
            {errorMsg && (
              <p
                role="alert"
                className="mt-2 text-[11px] text-red-700 inline-flex items-center gap-1"
              >
                <AlertCircle className="size-3" /> {errorMsg}
              </p>
            )}
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setState({ kind: 'idle' })
                  setReason('')
                }}
                disabled={submitting}
                className="btn-square btn-square-outline h-8 px-3 text-xs"
              >
                {t('dashboard.triage.rejectForm.cancel')}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="btn-square btn-square-red h-8 px-3 text-xs"
              >
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                {t('dashboard.triage.rejectForm.submit')}
              </button>
            </div>
          </div>
        )}

        {/* Inline approve + assign form */}
        {formMode === 'approving' && (
          <div className="mt-3 p-3 bg-olive-50/60 border border-olive-200 rounded-md">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider text-olive-800 font-semibold mb-1.5">
                {t('dashboard.triage.assignForm.heading')}
              </span>
              {teams === null ? (
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="size-3 animate-spin" />{' '}
                  {t('dashboard.triage.assignForm.loadingTeams')}
                </span>
              ) : teams.length === 0 ? (
                <span className="text-xs text-gray-600">
                  {t('dashboard.triage.assignForm.noTeams')}
                </span>
              ) : (
                <select
                  className="select text-sm py-2"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  disabled={submitting}
                  autoFocus
                >
                  <option value="">{t('dashboard.triage.assignForm.teamPlaceholder')}</option>
                  {teams.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} · {tm.zone}{' '}
                      {t('dashboard.triage.assignForm.teamMembers', { count: tm.memberCount })}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="block mt-3">
              <span className="block text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5">
                {t('dashboard.triage.assignForm.noteLabel')}
              </span>
              <textarea
                className="textarea text-sm"
                rows={2}
                style={{ minHeight: '3.5rem' }}
                placeholder={t('dashboard.triage.assignForm.notePlaceholder')}
                value={agentNote}
                onChange={(e) => setAgentNote(e.target.value)}
                disabled={submitting}
              />
            </label>

            {errorMsg && (
              <p
                role="alert"
                className="mt-2 text-[11px] text-red-700 inline-flex items-center gap-1"
              >
                <AlertCircle className="size-3" /> {errorMsg}
              </p>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setState({ kind: 'idle' })
                  setTeamId('')
                  setAgentNote('')
                }}
                disabled={submitting}
                className="btn-square btn-square-outline h-8 px-3 text-xs"
              >
                {t('dashboard.triage.assignForm.cancel')}
              </button>
              <button
                type="button"
                onClick={handleApproveAndAssign}
                disabled={submitting || !teams || teams.length === 0}
                className="btn-square btn-square-red h-8 px-3 text-xs"
              >
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                {t('dashboard.triage.assignForm.submit')}
              </button>
            </div>

            <div className="mt-2 text-end">
              <button
                type="button"
                onClick={handleApproveOnly}
                disabled={submitting}
                className="text-[11px] text-gray-500 hover:text-olive-800 underline underline-offset-2 disabled:opacity-50"
              >
                {t('dashboard.triage.assignForm.submitOnly')}
              </button>
            </div>
          </div>
        )}

        {/* Default action row */}
        {formMode === 'idle' && (
          <div className="mt-auto pt-3 space-y-2">
            <span className="text-[11px] text-gray-500 inline-flex items-center gap-1 truncate max-w-full">
              <User className="size-3 shrink-0" />
              <span className="truncate">{report.reporter.name ?? t('common.anonymous')}</span>
            </span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              <button
                onClick={onOpen}
                className="btn-square btn-square-outline h-8 px-2.5 text-xs"
                aria-label={t('dashboard.triage.card.viewDetail')}
              >
                <Eye className="size-3.5" />
              </button>
              <button
                onClick={() => setState({ kind: 'rejecting' })}
                disabled={submitting}
                className="btn-square btn-square-outline h-8 px-3 text-xs"
              >
                <X className="size-3.5" />
                {t('dashboard.triage.card.reject')}
              </button>
              <button
                onClick={() => setState({ kind: 'approving' })}
                disabled={submitting}
                className="btn-square btn-square-red h-8 px-3 text-xs"
              >
                <UsersIcon className="size-3.5" />
                {t('dashboard.triage.card.approveAndAssign')}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
