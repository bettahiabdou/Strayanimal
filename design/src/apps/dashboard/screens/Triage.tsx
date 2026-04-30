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
      setError(e instanceof ApiError ? e.message : 'Connexion impossible.')
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
            {t('dashboard.triage.subtitle')} — <span className="font-mono">{visible.length}</span>{' '}
            en file
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="btn-square btn-square-outline"
          aria-label="Rafraîchir"
        >
          <RefreshCcw className={cn('size-4', refreshing && 'animate-spin')} />
          Rafraîchir
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
  const [state, setState] = useState<CardState>({ kind: 'idle' })
  const [reason, setReason] = useState('')
  const [teamId, setTeamId] = useState('')
  const [agentNote, setAgentNote] = useState('')

  /* ─────────── Reject ─────────── */
  async function handleReject() {
    if (!reason.trim()) {
      setState({
        kind: 'error',
        message: 'Veuillez préciser le motif de rejet.',
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
        message: e instanceof ApiError ? e.message : 'Échec du rejet.',
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
        message: e instanceof ApiError ? e.message : 'Échec de la validation.',
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
        message: 'Veuillez choisir une équipe (ou utilisez « Valider sans assigner »).',
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
        message:
          e instanceof ApiError ? `${e.message} ${e.status === 409 ? '' : ''}`.trim() : 'Échec.',
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

        {/* Inline reject reason form */}
        {formMode === 'rejecting' && (
          <div className="mt-3 p-3 bg-red-50/60 border border-red-200 rounded-md">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider text-red-800 font-semibold mb-1.5">
                Motif du rejet
              </span>
              <textarea
                className="textarea text-sm"
                rows={2}
                placeholder="Doublon de OZN-... / hors-zone / spam / contenu inapproprié…"
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
                Annuler
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
                Confirmer le rejet
              </button>
            </div>
          </div>
        )}

        {/* Inline approve + assign form */}
        {formMode === 'approving' && (
          <div className="mt-3 p-3 bg-olive-50/60 border border-olive-200 rounded-md">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-wider text-olive-800 font-semibold mb-1.5">
                Assigner à une équipe
              </span>
              {teams === null ? (
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="size-3 animate-spin" /> Chargement des équipes…
                </span>
              ) : teams.length === 0 ? (
                <span className="text-xs text-gray-600">
                  Aucune équipe active disponible. Vous pouvez quand même valider sans assigner.
                </span>
              ) : (
                <select
                  className="textarea text-sm h-9"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  disabled={submitting}
                  autoFocus
                >
                  <option value="">— Choisir une équipe —</option>
                  {teams.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} · {tm.zone} ({tm.memberCount} membres)
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="block mt-3">
              <span className="block text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5">
                Note pour l'équipe (optionnel)
              </span>
              <textarea
                className="textarea text-sm"
                rows={2}
                placeholder="Précisions sur l'animal, accès, créneau…"
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

            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleApproveOnly}
                disabled={submitting}
                className="text-xs font-semibold text-olive-800 hover:text-olive-900 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Valider sans assigner
              </button>
              <div className="flex items-center gap-2">
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
                  Annuler
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
                  Valider et assigner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Default action row */}
        {formMode === 'idle' && (
          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500 inline-flex items-center gap-1 truncate">
              <User className="size-3" />
              {report.reporter.name ?? 'Anonyme'}
            </span>
            <div className="flex gap-1.5">
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
                Valider et assigner
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
