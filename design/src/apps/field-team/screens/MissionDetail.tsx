import { useState } from 'react'
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
} from 'lucide-react'
import { MOCK_MISSIONS, type MissionCategory } from '../data/mockMissions'
import { cn } from '@/design-system/cn'

const CATEGORY_TONE: Record<MissionCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

type Stage = 'idle' | 'enRoute' | 'onSite' | 'finishing' | 'finished'

export function MissionDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const Back = i18n.dir() === 'rtl' ? ChevronRight : ChevronLeft

  const mission = MOCK_MISSIONS.find((m) => m.id === id) ?? MOCK_MISSIONS[0]
  // Local stage starts from the persisted status
  const initialStage: Stage =
    mission.status === 'enRoute' ? 'enRoute' : mission.status === 'onSite' ? 'onSite' : 'idle'
  const [stage, setStage] = useState<Stage>(initialStage)
  const [outcome, setOutcome] = useState<'captured' | 'impossible' | null>(null)
  const [note, setNote] = useState('')

  if (stage === 'finished') return <CompleteScreen onBack={() => navigate('/field-team')} />

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
            <p className="font-mono text-[11px] text-gray-500">{mission.id}</p>
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
        <Fact icon={MapPin} label={t('fieldTeam.mission.distance')}>
          <span className="font-mono">{mission.distanceKm} km</span>
        </Fact>
        <Fact icon={Clock} label={t('fieldTeam.mission.estimated')}>
          <span className="font-mono">{mission.etaMin} min</span>
        </Fact>
        <Fact icon={MapPin} label={t('fieldTeam.mission.zone')}>
          {mission.zone}
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
        <blockquote className="bg-gray-50 border-s-4 border-olive-500 rounded-r-md p-3 text-[13px] italic text-gray-800 leading-relaxed">
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
          <p className="text-[13px] text-gray-800 leading-relaxed">{mission.agentNote}</p>
        ) : (
          <p className="text-[13px] text-gray-500 italic">{t('fieldTeam.mission.noNote')}</p>
        )}
      </div>

      {/* Navigate button */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(mission.address + ', Ouarzazate')}`}
          target="_blank"
          rel="noreferrer"
          className="btn-square btn-square-olive w-full h-12"
        >
          <Navigation className="size-5" />
          {t('fieldTeam.mission.navigate')}
        </a>
      </div>

      {/* Action panel — shape depends on stage */}
      <ActionPanel
        stage={stage}
        outcome={outcome}
        note={note}
        setNote={setNote}
        onDepart={() => setStage('enRoute')}
        onArrive={() => setStage('onSite')}
        onCapture={() => {
          setOutcome('captured')
          setStage('finishing')
        }}
        onImpossible={() => {
          setOutcome('impossible')
          setStage('finishing')
        }}
        onCancelOutcome={() => {
          setOutcome(null)
          setStage('onSite')
        }}
        onSubmit={() => setStage('finished')}
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
        <button onClick={onDepart} className="btn-square btn-square-red w-full h-14 text-base">
          <Truck className="size-5" />
          {t('fieldTeam.actions.depart')}
        </button>
      </div>
    )
  }

  if (stage === 'enRoute') {
    return (
      <div className="px-5 py-4 bg-white space-y-3">
        <Banner tone="active" icon={Truck} text="En route — bonne mission." />
        <button onClick={onArrive} className="btn-square btn-square-red w-full h-14 text-base">
          <MapPin className="size-5" />
          {t('fieldTeam.actions.onSite')}
        </button>
      </div>
    )
  }

  if (stage === 'onSite') {
    return (
      <div className="px-5 py-4 bg-white space-y-3">
        <Banner tone="alert" icon={MapPin} text="Vous êtes sur place." />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onImpossible}
            className="btn-square btn-square-outline h-14 text-base flex-col gap-1 py-2"
          >
            <XCircle className="size-5" />
            <span>{t('fieldTeam.actions.impossible')}</span>
          </button>
          <button
            onClick={onCapture}
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
        text={isImpossible ? 'Marqué comme impossible.' : 'Capture réussie.'}
      />

      {/* Photo */}
      <div>
        <p className="text-sm font-semibold text-gray-800">{t('fieldTeam.actions.addPhoto')}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t('fieldTeam.actions.addPhotoSubtitle')}</p>
        <label className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 active:border-red-500 rounded-md py-8 cursor-pointer text-gray-500 active:text-red-600 bg-gray-50">
          <Camera className="size-7" />
          <span className="text-sm font-semibold">Prendre la photo</span>
          <input type="file" accept="image/*" capture="environment" className="sr-only" />
        </label>
      </div>

      {/* Note */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">{t('fieldTeam.actions.addNote')}</p>
        <textarea
          className="textarea text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('fieldTeam.actions.notePlaceholder')}
        />
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={onSubmit}
          className={cn(
            'btn-square w-full h-14 text-base',
            isImpossible ? 'btn-square-olive' : 'btn-square-red',
          )}
        >
          <Send className="size-5" />
          {isImpossible ? t('fieldTeam.actions.submitImpossible') : t('fieldTeam.actions.submit')}
        </button>
        <button
          onClick={onCancelOutcome}
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
