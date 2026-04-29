import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Save,
  Building2,
  Bell,
  Database,
  Plug,
  AlertTriangle,
  Check,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/design-system/cn'

export function Settings() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t('dashboard.settings.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.settings.subtitle')}</p>
        </div>
        <button className="btn-square btn-square-red">
          <Save className="size-4" />
          {t('dashboard.settings.saveAll')}
        </button>
      </div>

      <GeneralSection />
      <NotificationsSection />
      <RetentionSection />
      <IntegrationsSection />
      <DangerSection />
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  tone = 'normal',
}: {
  icon: typeof Building2
  title: string
  subtitle: string
  children: React.ReactNode
  tone?: 'normal' | 'danger'
}) {
  return (
    <section
      className={cn(
        'bg-white border rounded-md overflow-hidden',
        tone === 'danger' ? 'border-red-200' : 'border-gray-200',
      )}
    >
      <header className="px-5 py-4 border-b border-gray-200 flex items-start gap-3">
        <div
          className={cn(
            'size-10 rounded-md grid place-items-center shrink-0',
            tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-olive-50 text-olive-700',
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={cn('font-bold', tone === 'danger' ? 'text-red-700' : 'text-gray-900')}>
            {title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-800 mb-2">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="w-full flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-b-0 group"
    >
      <span className="text-sm text-gray-800 text-start">{label}</span>
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors shrink-0',
          on ? 'bg-olive-600' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 bg-white rounded-full shadow transition-all',
            on ? 'start-[1.375rem]' : 'start-0.5',
          )}
        />
      </span>
    </button>
  )
}

function GeneralSection() {
  const { t } = useTranslation()
  return (
    <SectionCard
      icon={Building2}
      title={t('dashboard.settings.general.title')}
      subtitle={t('dashboard.settings.general.subtitle')}
    >
      <div className="grid md:grid-cols-2 gap-5">
        <Field label={t('dashboard.settings.general.communeName')}>
          <input
            className="input"
            defaultValue="Groupement des communes territoriales — Ouarzazate"
          />
        </Field>
        <Field label={t('dashboard.settings.general.serviceTitle')}>
          <input className="input" defaultValue="Service de protection des animaux errants" />
        </Field>
        <Field label={t('dashboard.settings.general.publicHotline')}>
          <input className="input font-mono" defaultValue="0524 88 24 87" />
        </Field>
        <Field label={t('dashboard.settings.general.internalHotline')}>
          <input className="input font-mono" defaultValue="0524 88 50 12" />
        </Field>
        <Field label={t('dashboard.settings.general.publicEmail')}>
          <input className="input" defaultValue="info@animaux-ouarzazate.ma" type="email" />
        </Field>
        <Field label={t('dashboard.settings.general.address')}>
          <input className="input" defaultValue="Avenue Mohammed V, Ouarzazate 45000" />
        </Field>
        <div className="md:col-span-2">
          <Field label={t('dashboard.settings.general.openingHours')}>
            <textarea
              className="textarea"
              defaultValue={'Lundi – Vendredi : 08h30 – 17h00\nWeek-end : urgences uniquement'}
            />
          </Field>
        </div>
      </div>
    </SectionCard>
  )
}

function NotificationsSection() {
  const { t } = useTranslation()
  return (
    <SectionCard
      icon={Bell}
      title={t('dashboard.settings.notifications.title')}
      subtitle={t('dashboard.settings.notifications.subtitle')}
    >
      <div>
        <Toggle label={t('dashboard.settings.notifications.newReportEmail')} defaultChecked />
        <Toggle label={t('dashboard.settings.notifications.urgentSms')} defaultChecked />
        <Toggle label={t('dashboard.settings.notifications.teamPushEnabled')} defaultChecked />
        <Toggle label={t('dashboard.settings.notifications.dailyDigest')} />
        <Toggle label={t('dashboard.settings.notifications.citizenSmsConfirm')} defaultChecked />
      </div>
    </SectionCard>
  )
}

function RetentionSection() {
  const { t } = useTranslation()
  const opts = [
    { value: 'month3', label: t('dashboard.settings.duration.month3') },
    { value: 'month6', label: t('dashboard.settings.duration.month6') },
    { value: 'year1', label: t('dashboard.settings.duration.year1') },
    { value: 'year2', label: t('dashboard.settings.duration.year2') },
    { value: 'year5', label: t('dashboard.settings.duration.year5') },
  ]
  return (
    <SectionCard
      icon={Database}
      title={t('dashboard.settings.retention.title')}
      subtitle={t('dashboard.settings.retention.subtitle')}
    >
      <div className="grid md:grid-cols-3 gap-5">
        <Field label={t('dashboard.settings.retention.reportRetention')}>
          <select className="select" defaultValue="year2">
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('dashboard.settings.retention.photoRetention')}>
          <select className="select" defaultValue="year1">
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('dashboard.settings.retention.auditRetention')}>
          <select className="select" defaultValue="year5">
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Toggle label={t('dashboard.settings.retention.anonymize')} defaultChecked />
      </div>
    </SectionCard>
  )
}

function IntegrationsSection() {
  const { t } = useTranslation()
  const items = [
    { key: 'mapbox', connected: true },
    { key: 'twilio', connected: true },
    { key: 'fcm', connected: false },
  ] as const
  return (
    <SectionCard
      icon={Plug}
      title={t('dashboard.settings.integrations.title')}
      subtitle={t('dashboard.settings.integrations.subtitle')}
    >
      <ul className="divide-y divide-gray-100">
        {items.map((it) => (
          <li key={it.key} className="py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">
                {t(`dashboard.settings.integrations.${it.key}`)}
              </p>
              <p className="text-xs mt-0.5 inline-flex items-center gap-1.5">
                {it.connected ? (
                  <span className="text-emerald-600 inline-flex items-center gap-1.5">
                    <Check className="size-3" />
                    {t('dashboard.settings.integrations.connected')}
                  </span>
                ) : (
                  <span className="text-gray-500">
                    {t('dashboard.settings.integrations.notConnected')}
                  </span>
                )}
              </p>
            </div>
            <button className="btn-square btn-square-outline h-9 px-3 text-xs">
              {t('dashboard.settings.integrations.configure')}
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

function DangerSection() {
  const { t } = useTranslation()
  return (
    <SectionCard
      tone="danger"
      icon={AlertTriangle}
      title={t('dashboard.settings.danger.title')}
      subtitle={t('dashboard.settings.danger.subtitle')}
    >
      <div className="flex flex-wrap gap-3">
        <button className="btn-square btn-square-outline">
          {t('dashboard.settings.danger.exportAll')}
        </button>
        <button className="btn-square btn-square-red">
          {t('dashboard.settings.danger.purge')}
        </button>
      </div>
    </SectionCard>
  )
}
