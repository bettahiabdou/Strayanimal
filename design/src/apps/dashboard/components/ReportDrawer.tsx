import { useEffect } from 'react'
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
  RefreshCcw,
  StickyNote,
  Map as MapIcon,
} from 'lucide-react'
import { type Report } from '../data/mockReports'
import { StatusBadge } from './StatusBadge'
import { CategoryBadge } from './CategoryBadge'
import { cn } from '@/design-system/cn'

type Props = {
  report: Report | null
  onClose: () => void
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
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function ReportDrawer({ report, onClose }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (report) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [report, onClose])

  if (!report) return null

  const timeline = buildTimeline(report)

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label={t('dashboard.detail.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      {/* Panel */}
      <aside className="absolute end-0 top-0 h-svh w-full sm:w-[640px] bg-white shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              {t('dashboard.detail.reference')}
            </p>
            <p className="font-mono text-base font-bold text-gray-900">{report.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />
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
          {/* Photo */}
          <div className="aspect-video bg-gray-100">
            <img src={report.photoUrl} alt="" className="size-full object-cover" />
          </div>

          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-6 border-b border-gray-200">
            <Fact label={t('dashboard.detail.category')}>
              <CategoryBadge category={report.category} />
            </Fact>
            <Fact label={t('dashboard.detail.animals')}>
              <span className="font-mono text-gray-900 font-semibold">× {report.animalCount}</span>
            </Fact>
            <Fact label={t('dashboard.detail.received')}>
              <span className="text-gray-800 text-sm">{fmtDate(report.receivedAt)}</span>
            </Fact>
            <Fact label={t('dashboard.detail.zone')}>
              <span className="text-gray-800 text-sm">{report.zone}</span>
            </Fact>
            <div className="col-span-2">
              <Fact label={t('dashboard.detail.address')}>
                <div className="flex items-center gap-2 text-gray-800 text-sm">
                  <MapPin className="size-4 text-gray-400 shrink-0" />
                  {report.address}
                </div>
                <button className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-olive-700 hover:text-olive-800">
                  <MapIcon className="size-3.5" />
                  {t('dashboard.detail.viewOnMap')}
                </button>
              </Fact>
            </div>
          </div>

          {/* Citizen comment */}
          <div className="p-6 border-b border-gray-200">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
              {t('dashboard.detail.citizenComment')}
            </p>
            <blockquote className="bg-gray-50 border-s-4 border-olive-500 rounded-r-md p-4 text-sm italic text-gray-800 leading-relaxed">
              « {report.comment} »
            </blockquote>
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5 text-gray-400" />
                {report.reporter.name ?? t('dashboard.detail.anonymous')}
              </span>
              {report.reporter.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 text-gray-400" />
                  <a href={`tel:${report.reporter.phone}`} className="hover:text-gray-900">
                    {report.reporter.phone}
                  </a>
                </span>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 border-b border-gray-200">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-4">
              {t('dashboard.detail.timeline')}
            </p>
            <ol className="space-y-4">
              {timeline.map((evt, i) => (
                <li key={i} className="grid grid-cols-[auto_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'size-3 rounded-full ring-4',
                        evt.tone === 'urgent' && 'bg-red-500 ring-red-100',
                        evt.tone === 'success' && 'bg-emerald-500 ring-emerald-100',
                        evt.tone === 'normal' && 'bg-olive-600 ring-olive-100',
                        evt.tone === 'muted' && 'bg-gray-400 ring-gray-100',
                      )}
                    />
                    {i < timeline.length - 1 && (
                      <span className="w-px flex-1 bg-gray-200 my-1 min-h-4" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm text-gray-900">{evt.label}</p>
                    <p className="text-xs text-gray-500 inline-flex items-center gap-1.5 mt-0.5">
                      <Clock className="size-3" /> {fmtTime(evt.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Internal notes */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t('dashboard.detail.noteSection')}
              </p>
              <button className="text-xs font-semibold text-olive-700 hover:text-olive-800 inline-flex items-center gap-1.5">
                <StickyNote className="size-3.5" />
                {t('dashboard.detail.addNote')}
              </button>
            </div>
            <p className="text-sm text-gray-500 italic">{t('dashboard.detail.noNotes')}</p>
          </div>
        </div>

        {/* Action footer */}
        <div className="border-t border-gray-200 p-4 flex flex-wrap gap-2 bg-gray-50">
          {report.status === 'pending' ? (
            <>
              <button className="btn-square btn-square-outline flex-1 min-w-32">
                <XCircle className="size-4" /> {t('dashboard.detail.reject')}
              </button>
              <button className="btn-square btn-square-red flex-1 min-w-32">
                <Check className="size-4" /> {t('dashboard.detail.approve')}
              </button>
            </>
          ) : (
            <>
              <button className="btn-square btn-square-outline flex-1 min-w-32">
                <RefreshCcw className="size-4" /> {t('dashboard.detail.changeStatus')}
              </button>
              <button className="btn-square btn-square-olive flex-1 min-w-32">
                <UsersIcon className="size-4" /> {t('dashboard.detail.assignTeam')}
              </button>
            </>
          )}
        </div>
      </aside>

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
    </div>
  )
}

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

type TimelineEvent = {
  label: string
  at: string
  tone: 'urgent' | 'normal' | 'success' | 'muted'
}

function buildTimeline(report: Report): TimelineEvent[] {
  const base = new Date(report.receivedAt).getTime()
  const events: TimelineEvent[] = [
    {
      label: 'Signalement reçu du citoyen',
      at: report.receivedAt,
      tone: report.isUrgent ? 'urgent' : 'normal',
    },
  ]
  if (['approved', 'assigned', 'inProgress', 'resolved'].includes(report.status)) {
    events.push({
      label: `Validé par ${report.agent ?? 'M. Belkadi'}`,
      at: new Date(base + 12 * 60 * 1000).toISOString(),
      tone: 'normal',
    })
  }
  if (['assigned', 'inProgress', 'resolved'].includes(report.status)) {
    events.push({
      label: `Assigné à ${report.team ?? 'Équipe Nord 02'}`,
      at: new Date(base + 18 * 60 * 1000).toISOString(),
      tone: 'normal',
    })
  }
  if (['inProgress', 'resolved'].includes(report.status)) {
    events.push({
      label: `Marqué en cours par ${report.team ?? 'Équipe Nord 02'}`,
      at: new Date(base + 35 * 60 * 1000).toISOString(),
      tone: 'normal',
    })
  }
  if (report.status === 'resolved') {
    events.push({
      label: 'Clôturé — capture réussie',
      at: new Date(base + 95 * 60 * 1000).toISOString(),
      tone: 'success',
    })
  }
  if (report.status === 'rejected') {
    events.push({
      label: `Rejeté par ${report.agent ?? 'M. Belkadi'}`,
      at: new Date(base + 8 * 60 * 1000).toISOString(),
      tone: 'muted',
    })
  }
  return events
}
