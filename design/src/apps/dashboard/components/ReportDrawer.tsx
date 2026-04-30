import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  MapPin,
  User,
  Phone,
  Clock,
  Check,
  XCircle,
  Users as UsersIcon,
  Loader2,
  AlertCircle,
  Send,
} from 'lucide-react'
import { api, ApiError, mediaUrl, type ReportDetail, type ApiTeam } from '@/lib/api'
import { StatusBadge } from './StatusBadge'
import { CategoryBadge } from './CategoryBadge'
import { cn } from '@/design-system/cn'

type Props = {
  /**
   * The report's public ref (e.g. "OZN-2618-47") to load. `null` closes the drawer.
   * The dashboard's adapter exposes publicRef as the local `id` field, so callers
   * can pass `report.id` here.
   */
  publicRef: string | null
  onClose: () => void
  /** Called when an action mutates the report so the parent can refetch. */
  onMutated?: () => void
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })

/* ─────────────── Local categorisation for adapter parity ─────────────── */

const STATUS_LOWER = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'inProgress',
  RESOLVED: 'resolved',
  IMPOSSIBLE: 'impossible',
  REJECTED: 'rejected',
} as const

const CATEGORY_LOWER = {
  AGGRESSIVE: 'aggressive',
  INJURED: 'injured',
  STRAY: 'stray',
} as const

/* ─────────────── Audit-action → i18n key ─────────────── */

function labelForAudit(
  action: string,
  details: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const d = (details ?? {}) as Record<string, unknown>
  switch (action) {
    case 'report.submit':
      return t('dashboard.detail.timeline.submit')
    case 'report.approve':
      return t('dashboard.detail.timeline.approve')
    case 'report.reject': {
      const reason = typeof d.reason === 'string' ? d.reason : null
      return reason
        ? t('dashboard.detail.timeline.rejectWithReason', { reason })
        : t('dashboard.detail.timeline.reject')
    }
    case 'report.assign': {
      const team = typeof d.teamName === 'string' ? d.teamName : null
      return team
        ? t('dashboard.detail.timeline.assignToTeam', { team })
        : t('dashboard.detail.timeline.assign')
    }
    case 'mission.en_route':
      return t('dashboard.detail.timeline.enRoute')
    case 'mission.on_site':
      return t('dashboard.detail.timeline.onSite')
    case 'mission.captured':
      return t('dashboard.detail.timeline.captured')
    case 'mission.impossible':
      return t('dashboard.detail.timeline.impossible')
    default:
      return action
  }
}

function toneForAudit(action: string): 'urgent' | 'normal' | 'success' | 'muted' {
  if (action === 'report.reject' || action === 'mission.impossible') return 'muted'
  if (action === 'mission.captured') return 'success'
  if (action === 'report.submit') return 'urgent'
  return 'normal'
}

/* ─────────────── Drawer ─────────────── */

type CardState =
  | { kind: 'idle' }
  | { kind: 'rejectForm' }
  | { kind: 'assignForm' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string; previous: 'idle' | 'rejectForm' | 'assignForm' }

export function ReportDrawer({ publicRef, onClose, onMutated }: Props) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [state, setState] = useState<CardState>({ kind: 'idle' })
  const [reason, setReason] = useState('')
  const [teamId, setTeamId] = useState('')
  const [agentNote, setAgentNote] = useState('')
  const [teams, setTeams] = useState<ApiTeam[] | null>(null)

  // Load detail whenever the drawer opens for a new ref.
  useEffect(() => {
    if (!publicRef) {
      setDetail(null)
      setLoadError(null)
      setState({ kind: 'idle' })
      setReason('')
      setTeamId('')
      setAgentNote('')
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    api
      .getReport(publicRef)
      .then(({ report }) => {
        if (!cancelled) setDetail(report)
      })
      .catch((e) => {
        if (!cancelled)
          setLoadError(e instanceof ApiError ? e.message : t('dashboard.detail.errors.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [publicRef])

  // Lazy-load teams the first time the assign form is opened.
  useEffect(() => {
    if (state.kind !== 'assignForm' || teams !== null) return
    api
      .listTeams()
      .then((r) => setTeams(r.teams))
      .catch(() => setTeams([]))
  }, [state.kind, teams])

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (publicRef) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [publicRef, onClose])

  if (!publicRef) return null

  /* ─────────── Actions ─────────── */

  async function handleApprove() {
    if (!detail) return
    setState({ kind: 'submitting' })
    try {
      await api.approveReport(detail.publicRef)
      onMutated?.()
      // Reload the detail to refresh status/audit.
      const { report } = await api.getReport(detail.publicRef)
      setDetail(report)
      setState({ kind: 'idle' })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof ApiError ? e.message : t('dashboard.detail.errors.approveFailed'),
        previous: 'idle',
      })
    }
  }

  async function handleReject() {
    if (!detail) return
    if (!reason.trim()) {
      setState({
        kind: 'error',
        message: t('dashboard.detail.errors.reasonRequired'),
        previous: 'rejectForm',
      })
      return
    }
    setState({ kind: 'submitting' })
    try {
      await api.rejectReport(detail.publicRef, reason.trim())
      onMutated?.()
      const { report } = await api.getReport(detail.publicRef)
      setDetail(report)
      setReason('')
      setState({ kind: 'idle' })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof ApiError ? e.message : t('dashboard.detail.errors.rejectFailed'),
        previous: 'rejectForm',
      })
    }
  }

  async function handleAssign() {
    if (!detail) return
    if (!teamId) {
      setState({
        kind: 'error',
        message: t('dashboard.detail.errors.teamRequired'),
        previous: 'assignForm',
      })
      return
    }
    setState({ kind: 'submitting' })
    try {
      await api.assignReport(detail.publicRef, teamId, agentNote.trim() || undefined)
      onMutated?.()
      const { report } = await api.getReport(detail.publicRef)
      setDetail(report)
      setAgentNote('')
      setTeamId('')
      setState({ kind: 'idle' })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof ApiError ? e.message : t('dashboard.detail.errors.assignFailed'),
        previous: 'assignForm',
      })
    }
  }

  /* ─────────── Render ─────────── */

  const submitting = state.kind === 'submitting'
  const errorMsg = state.kind === 'error' ? state.message : null
  const formMode: 'idle' | 'rejectForm' | 'assignForm' =
    state.kind === 'rejectForm' || state.kind === 'assignForm'
      ? state.kind
      : state.kind === 'error'
        ? state.previous
        : 'idle'

  return (
    // z-[1200] so we sit above Leaflet's internal chrome (controls = 1000,
    // popups = 700, tooltips = 650). Without this, the map's +/- buttons,
    // the attribution bar, and pin tooltips render *over* the drawer when
    // it's opened from /dashboard/map.
    <div className="fixed inset-0 z-[1200]">
      <button
        aria-label={t('dashboard.detail.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      <aside className="absolute end-0 top-0 h-svh w-full sm:w-[640px] bg-white shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              {t('dashboard.detail.reference')}
            </p>
            <p className="font-mono text-base font-bold text-gray-900">{publicRef}</p>
          </div>
          <div className="flex items-center gap-3">
            {detail && <StatusBadge status={STATUS_LOWER[detail.status]} />}
            <button
              aria-label={t('dashboard.detail.close')}
              onClick={onClose}
              className="size-9 rounded-md hover:bg-gray-100 grid place-items-center text-gray-500"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="grid place-items-center p-16 text-gray-400">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}

          {loadError && !loading && (
            <div className="p-6">
              <div
                role="alert"
                className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm"
              >
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{loadError}</span>
              </div>
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Photos */}
              <PhotoGallery media={detail.media} />

              {/* Quick facts */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-6 border-b border-gray-200">
                <Fact label={t('dashboard.detail.category')}>
                  <CategoryBadge category={CATEGORY_LOWER[detail.category]} />
                </Fact>
                <Fact label={t('dashboard.detail.animals')}>
                  <span className="font-mono text-gray-900 font-semibold">
                    × {detail.animalCount}
                  </span>
                </Fact>
                <Fact label={t('dashboard.detail.received')}>
                  <span className="text-gray-800 text-sm">{fmtDate(detail.receivedAt)}</span>
                </Fact>
                <Fact label={t('dashboard.detail.zone')}>
                  <span className="text-gray-800 text-sm">{detail.zone}</span>
                </Fact>
                <div className="col-span-2">
                  <Fact label={t('dashboard.detail.address')}>
                    <div className="flex items-start gap-2 text-gray-800 text-sm">
                      <MapPin className="size-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>{detail.address}</span>
                    </div>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${detail.latitude}&mlon=${detail.longitude}&zoom=17`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-olive-700 hover:text-olive-800"
                    >
                      <MapPin className="size-3.5" />
                      {detail.latitude.toFixed(5)}, {detail.longitude.toFixed(5)} ↗
                    </a>
                  </Fact>
                </div>
              </div>

              {/* Citizen comment + contact */}
              <div className="p-6 border-b border-gray-200">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  {t('dashboard.detail.citizenComment')}
                </p>
                <blockquote className="bg-gray-50 border-s-4 border-olive-500 rounded-e-md p-4 text-sm italic text-gray-800 leading-relaxed whitespace-pre-line">
                  « {detail.comment} »
                </blockquote>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-3.5 text-gray-400" />
                    {detail.citizenName ?? t('dashboard.detail.anonymous')}
                  </span>
                  {detail.citizenPhone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-gray-400" />
                      <a
                        href={`tel:${detail.citizenPhone}`}
                        className="hover:text-gray-900 underline-offset-2 hover:underline"
                      >
                        {detail.citizenPhone}
                      </a>
                    </span>
                  )}
                </div>
              </div>

              {/* Reject reason */}
              {detail.status === 'REJECTED' && detail.rejectReason && (
                <div className="p-6 border-b border-gray-200 bg-red-50/40">
                  <p className="text-[10px] uppercase tracking-wider text-red-800 font-semibold mb-2">
                    {t('dashboard.detail.section.rejectReason')}
                  </p>
                  <p className="text-sm text-red-900">{detail.rejectReason}</p>
                </div>
              )}

              {/* Mission */}
              {detail.mission && (
                <div className="p-6 border-b border-gray-200">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
                    {t('dashboard.detail.section.mission')}
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <Fact label={t('dashboard.detail.section.team')}>
                      <span className="text-sm text-gray-900">
                        {detail.mission.team?.name ?? '—'}
                      </span>
                      {detail.mission.team?.zone && (
                        <span className="block text-xs text-gray-500">
                          {detail.mission.team.zone}
                        </span>
                      )}
                    </Fact>
                    <Fact label={t('dashboard.detail.section.missionStatus')}>
                      <span className="text-sm text-gray-900 capitalize">
                        {detail.mission.status.toLowerCase().replace('_', ' ')}
                      </span>
                    </Fact>
                    {detail.mission.agentNote && (
                      <div className="col-span-2">
                        <Fact label={t('dashboard.detail.section.agentNote')}>
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {detail.mission.agentNote}
                          </p>
                        </Fact>
                      </div>
                    )}
                    {detail.mission.fieldNote && (
                      <div className="col-span-2">
                        <Fact label={t('dashboard.detail.section.fieldNote')}>
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {detail.mission.fieldNote}
                          </p>
                        </Fact>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="p-6">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-4">
                  {t('dashboard.detail.timeline')}
                </p>
                {detail.audit.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    {t('dashboard.detail.section.noEvents')}
                  </p>
                ) : (
                  <ol className="space-y-4">
                    {detail.audit.map((evt, i) => {
                      const tone = toneForAudit(evt.action)
                      return (
                        <li key={evt.id} className="grid grid-cols-[auto_1fr] gap-3">
                          <div className="flex flex-col items-center">
                            <span
                              className={cn(
                                'size-3 rounded-full ring-4',
                                tone === 'urgent' && 'bg-red-500 ring-red-100',
                                tone === 'success' && 'bg-emerald-500 ring-emerald-100',
                                tone === 'normal' && 'bg-olive-600 ring-olive-100',
                                tone === 'muted' && 'bg-gray-400 ring-gray-100',
                              )}
                            />
                            {i < detail.audit.length - 1 && (
                              <span className="w-px flex-1 bg-gray-200 my-1 min-h-4" />
                            )}
                          </div>
                          <div className="pb-1">
                            <p className="text-sm text-gray-900">
                              {labelForAudit(evt.action, evt.details, t)}
                            </p>
                            <p className="text-xs text-gray-500 inline-flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <Clock className="size-3" /> {fmtTime(evt.at)}
                              <span className="text-gray-300">·</span>
                              <span>{evt.who}</span>
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action footer */}
        {detail && !loading && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {/* Inline reject form */}
            {formMode === 'rejectForm' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-wider text-red-800 font-semibold mb-1.5">
                    {t('dashboard.detail.rejectForm.heading')}
                  </span>
                  <textarea
                    className="textarea text-sm"
                    rows={2}
                    placeholder={t('dashboard.detail.rejectForm.placeholder')}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={submitting}
                    autoFocus
                  />
                </label>
                {errorMsg && (
                  <p
                    role="alert"
                    className="text-[11px] text-red-700 inline-flex items-center gap-1"
                  >
                    <AlertCircle className="size-3" /> {errorMsg}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setState({ kind: 'idle' })
                      setReason('')
                    }}
                    disabled={submitting}
                    className="btn-square btn-square-outline h-9 px-3 text-xs"
                  >
                    {t('dashboard.detail.rejectForm.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={submitting}
                    className="btn-square btn-square-red h-9 px-3 text-xs"
                  >
                    {submitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    {t('dashboard.detail.rejectForm.submit')}
                  </button>
                </div>
              </div>
            )}

            {/* Inline assign form */}
            {formMode === 'assignForm' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-wider text-olive-800 font-semibold mb-1.5">
                    {t('dashboard.detail.assignForm.heading')}
                  </span>
                  {teams === null ? (
                    <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="size-3 animate-spin" />{' '}
                      {t('dashboard.detail.assignForm.loadingTeams')}
                    </span>
                  ) : teams.length === 0 ? (
                    <span className="text-xs text-gray-600">
                      {t('dashboard.detail.assignForm.noTeams')}
                    </span>
                  ) : (
                    <select
                      className="textarea text-sm h-9"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      disabled={submitting}
                      autoFocus
                    >
                      <option value="">{t('dashboard.detail.assignForm.teamPlaceholder')}</option>
                      {teams.map((tm) => (
                        <option key={tm.id} value={tm.id}>
                          {tm.name} · {tm.zone}{' '}
                          {t('dashboard.detail.assignForm.teamMembers', {
                            count: tm.memberCount,
                          })}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5">
                    {t('dashboard.detail.assignForm.noteLabel')}
                  </span>
                  <textarea
                    className="textarea text-sm"
                    rows={2}
                    placeholder={t('dashboard.detail.assignForm.notePlaceholder')}
                    value={agentNote}
                    onChange={(e) => setAgentNote(e.target.value)}
                    disabled={submitting}
                  />
                </label>
                {errorMsg && (
                  <p
                    role="alert"
                    className="text-[11px] text-red-700 inline-flex items-center gap-1"
                  >
                    <AlertCircle className="size-3" /> {errorMsg}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setState({ kind: 'idle' })
                      setAgentNote('')
                      setTeamId('')
                    }}
                    disabled={submitting}
                    className="btn-square btn-square-outline h-9 px-3 text-xs"
                  >
                    {t('dashboard.detail.assignForm.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={submitting || !teams || teams.length === 0}
                    className="btn-square btn-square-olive h-9 px-3 text-xs"
                  >
                    {submitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <UsersIcon className="size-3.5" />
                    )}
                    {t('dashboard.detail.assignForm.submit')}
                  </button>
                </div>
              </div>
            )}

            {/* Default action row */}
            {formMode === 'idle' && (
              <>
                {errorMsg && (
                  <p
                    role="alert"
                    className="mb-2 text-[11px] text-red-700 inline-flex items-center gap-1"
                  >
                    <AlertCircle className="size-3" /> {errorMsg}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {detail.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => setState({ kind: 'rejectForm' })}
                        disabled={submitting}
                        className="btn-square btn-square-outline flex-1 min-w-32"
                      >
                        <XCircle className="size-4" />
                        {t('dashboard.detail.reject')}
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="btn-square btn-square-red flex-1 min-w-32"
                      >
                        {submitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        {t('dashboard.detail.approve')}
                      </button>
                    </>
                  )}
                  {detail.status === 'APPROVED' && (
                    <button
                      onClick={() => setState({ kind: 'assignForm' })}
                      disabled={submitting}
                      className="btn-square btn-square-olive flex-1"
                    >
                      <UsersIcon className="size-4" />
                      {t('dashboard.detail.assignTeam')}
                    </button>
                  )}
                  {(detail.status === 'ASSIGNED' ||
                    detail.status === 'IN_PROGRESS' ||
                    detail.status === 'RESOLVED' ||
                    detail.status === 'IMPOSSIBLE' ||
                    detail.status === 'REJECTED') && (
                    <p className="text-xs text-gray-500 flex-1 self-center">
                      {detail.status === 'REJECTED'
                        ? t('dashboard.detail.statusMessage.rejected')
                        : t('dashboard.detail.statusMessage.processing')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          [dir="rtl"] @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </aside>
    </div>
  )
}

/* ─────────── Sub-components ─────────── */

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
        {label}
      </p>
      {children}
    </div>
  )
}

function PhotoGallery({ media }: { media: ReportDetail['media'] }) {
  const { t } = useTranslation()
  const [activeIdx, setActiveIdx] = useState(0)
  const photos = media.filter(
    (m) => m.purpose === 'CITIZEN_REPORT' || m.purpose === 'POST_INTERVENTION',
  )
  if (photos.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 grid place-items-center text-gray-400 text-sm">
        {t('dashboard.detail.section.noPhoto')}
      </div>
    )
  }
  const active = photos[activeIdx] ?? photos[0]!
  return (
    <div>
      <div className="aspect-video bg-gray-100">
        <img
          src={mediaUrl(`/media/${active.id}`) ?? ''}
          alt=""
          className="size-full object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 px-6 py-3 border-b border-gray-200 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={cn(
                'size-14 rounded border-2 overflow-hidden shrink-0 transition',
                i === activeIdx ? 'border-olive-600' : 'border-transparent hover:border-gray-300',
              )}
            >
              <img
                src={mediaUrl(`/media/${p.id}`) ?? ''}
                alt=""
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
