import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Smartphone, Monitor, Truck } from 'lucide-react'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'
import { CommuneLogo } from '@/design-system/CommuneLogo'

const cards = [
  { to: '/citizen', icon: Smartphone, key: 'citizen' },
  { to: '/dashboard/login', icon: Monitor, key: 'dashboard' },
  { to: '/field-team/login', icon: Truck, key: 'fieldTeam' },
]

export function PreviewHub() {
  const { t } = useTranslation()
  return (
    <div className="min-h-svh bg-white flex flex-col">
      <div className="bg-olive-700 text-olive-100 h-9" />
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CommuneLogo size={48} />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t('common.communeFull')}
              </p>
              <p className="text-base font-bold text-gray-900">Ouarzazate</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-16 md:py-24">
          <p className="text-xs uppercase tracking-wider text-red-600 font-semibold">
            Aperçu Design — Avril 2026
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-gray-900 max-w-3xl">
            {t('preview.title')}
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl">{t('preview.subtitle')}</p>
          <p className="mt-10 text-xs uppercase tracking-wider font-semibold text-gray-500">
            {t('preview.chooseApp')}
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards.map(({ to, icon: Icon, key }) => (
              <Link
                key={to}
                to={to}
                className="group bg-white rounded-lg border border-gray-200 p-7 hover:border-red-600 hover:shadow-md transition-all"
              >
                <div className="size-12 rounded-md bg-red-600 grid place-items-center text-white">
                  <Icon className="size-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-gray-900">
                  {t(`preview.${key}.title`)}
                </h2>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                  {t(`preview.${key}.description`)}
                </p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 group-hover:gap-2.5 transition-all">
                  {t('preview.previewLink')}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-5 text-xs text-gray-500 flex items-center justify-between">
          <span>localhost:5173</span>
          <span>{t('common.communeFull')} — Ouarzazate</span>
        </div>
      </footer>
    </div>
  )
}
