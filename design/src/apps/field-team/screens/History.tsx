import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react'
import { COMPLETED_MISSIONS, type MissionCategory } from '../data/mockMissions'
import { cn } from '@/design-system/cn'

const CATEGORY_TONE: Record<MissionCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function History() {
  const { t } = useTranslation()
  const captured = COMPLETED_MISSIONS.filter((m) => m.outcome === 'captured').length
  const impossible = COMPLETED_MISSIONS.filter((m) => m.outcome === 'impossible').length
  const avg = COMPLETED_MISSIONS.length
    ? Math.round(
        COMPLETED_MISSIONS.reduce((s, m) => s + (m.durationMin ?? 0), 0) /
          COMPLETED_MISSIONS.length,
      )
    : 0

  return (
    <div className="pb-4">
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {t('fieldTeam.history.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t('fieldTeam.history.subtitle')}</p>
      </div>

      {/* Stats grid */}
      <div className="px-5 grid grid-cols-2 gap-2 mb-4">
        <Stat
          label={t('fieldTeam.history.stats.completed')}
          value={COMPLETED_MISSIONS.length}
          tone="olive"
        />
        <Stat label={t('fieldTeam.history.stats.captured')} value={captured} tone="emerald" />
        <Stat label={t('fieldTeam.history.stats.impossible')} value={impossible} tone="rose" />
        <Stat
          label={t('fieldTeam.history.stats.avgTime')}
          value={`${Math.floor(avg / 60)}h ${avg % 60}`}
          tone="blue"
        />
      </div>

      {/* List */}
      {COMPLETED_MISSIONS.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-gray-500">
          {t('fieldTeam.history.empty')}
        </p>
      ) : (
        <ul className="px-5 space-y-3">
          {COMPLETED_MISSIONS.map((m) => {
            const ok = m.outcome === 'captured'
            return (
              <li key={m.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex">
                  <div className="size-20 bg-gray-100 shrink-0">
                    <img
                      src={m.photoUrl}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0 p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                          CATEGORY_TONE[m.category],
                        )}
                      >
                        {t(`dashboard.category.${m.category}`)}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">{m.id}</span>
                    </div>
                    <p className="mt-1 text-[13px] font-bold text-gray-900 truncate">{m.address}</p>
                    <p className="text-[11px] text-gray-500 truncate inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {m.zone}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-bold uppercase',
                          ok ? 'text-emerald-700' : 'text-rose-700',
                        )}
                      >
                        {ok ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <XCircle className="size-3.5" />
                        )}
                        {ok ? t('fieldTeam.status.captured') : t('fieldTeam.status.impossible')}
                      </span>
                      <span className="text-[10px] text-gray-500 inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {m.finishedAt ? fmtTime(m.finishedAt) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'olive' | 'emerald' | 'rose' | 'blue'
}) {
  const styles = {
    olive: 'border-olive-200 text-olive-800',
    emerald: 'border-emerald-200 text-emerald-700',
    rose: 'border-rose-200 text-rose-700',
    blue: 'border-blue-200 text-blue-700',
  }[tone]
  return (
    <div className={cn('bg-white border rounded-lg px-3 py-2.5', styles)}>
      <p className="font-mono text-xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
        {label}
      </p>
    </div>
  )
}
