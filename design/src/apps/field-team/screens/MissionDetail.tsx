import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  Navigation,
  MapPin,
  Clock,
  User,
  StickyNote,
  Truck,
  CheckCircle2,
  XCircle,
  Camera,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { api, ApiError, type ApiMissionStatus } from '@/lib/api'
import { adaptMission } from '../data/adapter'
import type { Mission, MissionCategory, MissionStatus } from '../data/mockMissions'
import { cn } from '@/design-system/cn'

const CATEGORY_TONE: Record<MissionCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

/** Local UI stage. Mirrors mission.status but adds 'finishing' and 'finished'. */
type Stage = 'idle' | 'enRoute' | 'onSite' | 'finishing' | 'finished'

function stageFromStatus(s: MissionStatus): Stage {
  if (s === 'enRoute') return 'enRoute'
  if (s === 'onSite') return 'onSite'
  if (s === 'captured' || s === 'impossible' || s === 'completed') return 'finished'
  return 'idle'
}

/* Resize a File to JPEG data URL, ~1280px max side, q 0.82.
 * Same approach as the citizen-side PhotoPicker. Kept inline to avoid a
 * cross-app import. */
async function fileToResizedDataUrl(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    // Fallback: read as-is.
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

export function MissionDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const Back = i18n.dir() === 'rtl' ? ChevronRight : ChevronLeft

  const [mission, setMission] = useState<Mission | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [outcome, setOutcome] = useState<'captured' | 'impossible' | null>(null)
  const [note, setNote] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Load mission by listing the inbox and finding by id. Cheap and avoids
  // a second backend endpoint (active list is ≤ a few rows in practice).
  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([api.myMissions('active'), api.myMissions('completed')])
      .then(([active, completed]) => {
        if (cancelled) return
        const all = [...active.missions, ...completed.missions]
        const apiRow = all.find((m) => m.id === id)
        if (!apiRow) {
          setLoadError(t('fieldTeam.mission.errors.notFound'))
          return
        }
        const m = adaptMission(apiRow)
        setMission(m)
        setStage(stageFromStatus(m.status))
        if (m.outcome) setOutcome(m.outcome)
      })
      .catch((e) => {
        if (!cancelled)
          setLoadError(e instanceof ApiError ? e.message : t('fieldTeam.mission.errors.network'))
      })
    return () => {
      cancelled = true
    }
  }, [id])

  /* ─────────── Transitions ─────────── */

  async function transition(to: ApiMissionStatus, opts?: { fieldNote?: string; photo?: string }) {
    if (!mission) return
    setSubmitting(true)
    setActionError(null)
    try {
      const { mission: updated } = await api.transitionMission(mission.id, {
        to,
        ...(opts?.fieldNote ? { fieldNote: opts.fieldNote } : {}),
        ...(opts?.photo ? { photo: opts.photo } : {}),
      })
      // Reflect new status locally so the UI doesn't have to refetch.
      setMission((cur) =>
        cur
          ? {
              ...cur,
              status:
                updated.status === 'EN_ROUTE'
                  ? 'enRoute'
                  : updated.status === 'ON_SITE'
                    ? 'onSite'
                    : updated.status === 'CAPTURED'
                      ? 'captured'
                      : updated.status === 'IMPOSSIBLE'
                        ? 'impossible'
                        : cur.status,
              outcome:
                updated.outcome === 'CAPTURED'
                  ? 'captured'
                  : updated.outcome === 'IMPOSSIBLE'
                    ? 'impossible'
                    : cur.outcome,
              durationMin: updated.durationMin ?? cur.durationMin,
              finishedAt: updated.closedAt ?? cur.finishedAt,
            }
          : cur,
      )
      return updated
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : t('fieldTeam.mission.errors.network'))
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDepart() {
    try {
      await transition('EN_ROUTE')
      setStage('enRoute')
    } catch {
      /* error already set */
    }
  }
  async function handleArrive() {
    try {
      await transition('ON_SITE')
      setStage('onSite')
    } catch {
      /* error already set */
    }
  }
  async function handleSubmitOutcome() {
    if (!outcome) return
    const to: ApiMissionStatus = outcome === 'captured' ? 'CAPTURED' : 'IMPOSSIBLE'
    try {
      await transition(to, {
        fieldNote: note.trim() || undefined,
        photo: photoDataUrl ?? undefined,
      })
      setStage('finished')
    } catch {
      /* error already set */
    }
  }

  async function handlePhoto(file: File | null) {
    if (!file) {
      setPhotoDataUrl(null)
      return
    }
    try {
      const url = await fileToResizedDataUrl(file)
      setPhotoDataUrl(url)
    } catch {
      setActionError(t('fieldTeam.mission.errors.photoFailed'))
    }
  }

  if (loadError) {
    return (
      <div className="p-5">
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
        <Link
          to="/field-team"
          className="mt-4 inline-flex items-center gap-1 text-sm text-olive-700 font-semibold"
        >
          <Back className="size-4" />
          {t('common.back')}
        </Link>
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="p-12 grid place-items-center text-gray-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (stage === 'finished') return <CompleteScreen onBack={() => navigate('/field-team')} />

  const mapsHref =
    mission.latitude && mission.longitude
      ? `https://maps.google.com/?q=${mission.latitude},${mission.longitude}`
      : `https://maps.google.com/?q=${encodeURIComponent(mission.address + ', Ouarzazate')}`

  return (
    <div className="pb-4">
      {/* Sub-header with back */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 h-12 flex items-center gap-2">
          <Link
            to="/field-team"
            className="size-9 grid place-items-center rounded-md hover:bg-gray-100 text-gray-700"
            aria-label={t('fieldTeam.mission.back')}
          >
            <Back className="size-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[11px] text-gray-500">{mission.publicRef ?? mission.id}</p>
            <p className="text-[13px] font-bold text-gray-900 truncate">{mission.address}</p>
          </div>
        </div>
      </div>

      {/* Photo */}
      <div className="aspect-[16/10] bg-gray-100 relative">
        <img src={mission.photoUrl} alt="" className="size-full object-cover" />
        {mission.isUrgent && (
          <span className="absolute top-3 start-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            {t('fieldTeam.mission.urgent')}
          </span>
        )}
        <div className="absolute bottom-3 start-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
              CATEGORY_TONE[mission.category],
            )}
          >
            {t(`dashboard.category.${mission.category}`)}
          </span>
          <span className="bg-white/95 backdrop-blur text-[11px] font-semibold text-gray-800 border border-gray-200 rounded px-1.5 py-0.5">
            × {mission.animalCount}
          </span>
        </div>
      </div>

      {/* Quick facts grid */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 grid grid-cols-2 gap-4">
        <Fact icon={MapPin} label={t('fieldTeam.mission.zone')}>
          {mission.zone}
        </Fact>
        <Fact icon={Clock} label={t('fieldTeam.mission.receivedShort')}>
          <span className="font-mono">
            {new Date(mission.receivedAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </Fact>
        <Fact icon={User} label={t('fieldTeam.mission.agent')}>
          {mission.agentName}
        </Fact>
      </div>

      {/* Citizen comment */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          {t('fieldTeam.mission.citizenComment')}
        </p>
        <blockquote className="bg-gray-50 border-s-4 border-olive-500 rounded-e-md p-3 text-[13px] italic text-gray-800 leading-relaxed">
          « {mission.citizenComment} »
        </blockquote>
      </div>

      {/* Agent note */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 inline-flex items-center gap-1.5">
          <StickyNote className="size-3" />
          {t('fieldTeam.mission.agentNote')}
        </p>
        {mission.agentNote ? (
          <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-line">
            {mission.agentNote}
          </p>
        ) : (
          <p className="text-[13px] text-gray-500 italic">{t('fieldTeam.mission.noNote')}</p>
        )}
      </div>

      {/* Navigate button */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="btn-square btn-square-olive w-full h-12"
        >
          <Navigation className="size-5" />
          {t('fieldTeam.mission.navigate')}
        </a>
      </div>

      {actionError && (
        <div className="mx-5 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-xs">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Action panel — shape depends on stage */}
      <ActionPanel
        stage={stage}
        outcome={outcome}
        note={note}
        setNote={setNote}
        photoDataUrl={photoDataUrl}
        onPhoto={handlePhoto}
        submitting={submitting}
        onDepart={handleDepart}
        onArrive={handleArrive}
        onCapture={() => {
          setOutcome('captured')
          setStage('finishing')
          setActionError(null)
        }}
        onImpossible={() => {
          setOutcome('impossible')
          setStage('finishing')
          setActionError(null)
        }}
        onCancelOutcome={() => {
          setOutcome(null)
          setPhotoDataUrl(null)
          setNote('')
          setStage('onSite')
          setActionError(null)
        }}
        onSubmit={handleSubmitOutcome}
      />
    </div>
  )
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1 inline-flex items-center gap-1">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="text-[13px] text-gray-900 font-medium">{children}</p>
    </div>
  )
}

function ActionPanel({
  stage,
  outcome,
  note,
  setNote,
  photoDataUrl,
  onPhoto,
  submitting,
  onDepart,
  onArrive,
  onCapture,
  onImpossible,
  onCancelOutcome,
  onSubmit,
}: {
  stage: Stage
  outcome: 'captured' | 'impossible' | null
  note: string
  setNote: (s: string) => void
  photoDataUrl: string | null
  onPhoto: (f: File | null) => void
  submitting: boolean
  onDepart: () => void
  onArrive: () => void
  onCapture: () => void
  onImpossible: () => void
  onCancelOutcome: () => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()

  if (stage === 'idle') {
    return (
      <div className="px-5 py-4 bg-white">
        <button
          onClick={onDepart}
          disabled={submitting}
          className="btn-square btn-square-red w-full h-14 text-base"
        >
          {submitting ? <Loader2 className="size-5 animate-spin" /> : <Truck className="size-5" />}
          {t('fieldTeam.actions.depart')}
        </button>
      </div>
    )
  }

  if (stage === 'enRoute') {
    return (
      <div className="px-5 py-4 bg-white space-y-3">
        <Banner tone="active" icon={Truck} text={t('fieldTeam.mission.banner.enRoute')} />
        <button
          onClick={onArrive}
          disabled={submitting}
          className="btn-square btn-square-red w-full h-14 text-base"
        >
          {submitting ? <Loader2 className="size-5 animate-spin" /> : <MapPin className="size-5" />}
          {t('fieldTeam.actions.onSite')}
        </button>
      </div>
    )
  }

  if (stage === 'onSite') {
    return (
      <div className="px-5 py-4 bg-white space-y-3">
        <Banner tone="alert" icon={MapPin} text={t('fieldTeam.mission.banner.onSite')} />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onImpossible}
            disabled={submitting}
            className="btn-square btn-square-outline h-14 text-base flex-col gap-1 py-2"
          >
            <XCircle className="size-5" />
            <span>{t('fieldTeam.actions.impossible')}</span>
          </button>
          <button
            onClick={onCapture}
            disabled={submitting}
            className="btn-square btn-square-red h-14 text-base flex-col gap-1 py-2"
          >
            <CheckCircle2 className="size-5" />
            <span>{t('fieldTeam.actions.captured')}</span>
          </button>
        </div>
      </div>
    )
  }

  // stage === 'finishing'
  const isImpossible = outcome === 'impossible'
  return (
    <div className="px-5 py-4 bg-white space-y-4">
      <Banner
        tone={isImpossible ? 'muted' : 'success'}
        icon={isImpossible ? XCircle : CheckCircle2}
        text={t(
          isImpossible
            ? 'fieldTeam.mission.banner.impossible'
            : 'fieldTeam.mission.banner.captured',
        )}
      />

      {/* Photo */}
      <div>
        <p className="text-sm font-semibold text-gray-800">{t('fieldTeam.actions.addPhoto')}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t('fieldTeam.actions.addPhotoSubtitle')}</p>
        {photoDataUrl ? (
          <div className="mt-2 relative">
            <img
              src={photoDataUrl}
              alt=""
              className="w-full max-h-48 object-cover rounded-md border border-gray-200"
            />
            <button
              type="button"
              onClick={() => onPhoto(null)}
              className="absolute top-2 end-2 inline-flex items-center justify-center size-7 rounded-full bg-white/95 border border-gray-200 text-gray-700 shadow"
              aria-label={t('fieldTeam.mission.photoActions.removeAria')}
            >
              <XCircle className="size-4" />
            </button>
          </div>
        ) : (
          <label className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 active:border-red-500 rounded-md py-8 cursor-pointer text-gray-500 active:text-red-600 bg-gray-50">
            <Camera className="size-7" />
            <span className="text-sm font-semibold">
              {t('fieldTeam.mission.photoActions.takeButton')}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {/* Note */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">{t('fieldTeam.actions.addNote')}</p>
        <textarea
          className="textarea text-sm"
          style={{ minHeight: '4rem' }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('fieldTeam.actions.notePlaceholder')}
        />
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className={cn(
            'btn-square w-full h-14 text-base',
            isImpossible ? 'btn-square-olive' : 'btn-square-red',
          )}
        >
          {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          {isImpossible ? t('fieldTeam.actions.submitImpossible') : t('fieldTeam.actions.submit')}
        </button>
        <button
          onClick={onCancelOutcome}
          disabled={submitting}
          className="btn-square btn-square-outline w-full h-11 text-sm"
        >
          {t('fieldTeam.actions.back')}
        </button>
      </div>
    </div>
  )
}

function Banner({
  tone,
  icon: Icon,
  text,
}: {
  tone: 'active' | 'alert' | 'success' | 'muted'
  icon: typeof Truck
  text: string
}) {
  const styles = {
    active: 'bg-blue-50 text-blue-800 border-blue-200',
    alert: 'bg-orange-50 text-orange-800 border-orange-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    muted: 'bg-gray-100 text-gray-700 border-gray-200',
  }[tone]
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold',
        styles,
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

function CompleteScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="h-full grid place-items-center bg-gray-50 p-6">
      <div className="text-center">
        <div className="size-20 rounded-full bg-emerald-100 grid place-items-center mx-auto">
          <CheckCircle2 className="size-10 text-emerald-600" strokeWidth={1.75} />
        </div>
        <h2 className="mt-5 text-2xl font-black text-gray-900 tracking-tight">
          {t('fieldTeam.complete.title')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{t('fieldTeam.complete.subtitle')}</p>
        <button onClick={onBack} className="btn-square btn-square-red mt-7">
          {t('fieldTeam.complete.back')}
        </button>
      </div>
    </div>
  )
}
