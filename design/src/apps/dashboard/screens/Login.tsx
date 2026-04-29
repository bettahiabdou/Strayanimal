import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'

export function Login() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const Back = isRTL ? ChevronRight : ChevronLeft
  const navigate = useNavigate()

  return (
    <div className="min-h-svh bg-gray-50 grid lg:grid-cols-2">
      {/* Left brand panel — olive */}
      <div className="hidden lg:flex bg-olive-700 text-white relative overflow-hidden p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <CommuneLogo size={56} />
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
              {t('common.communeFull')}
            </p>
            <p className="text-base font-bold">Ouarzazate</p>
          </div>
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            {t('common.brand')}
          </p>
          <h1 className="mt-3 text-4xl xl:text-5xl font-black leading-[1.1] max-w-md">
            Plateforme de gestion des signalements citoyens.
          </h1>
          <p className="mt-5 text-white/85 text-base max-w-md leading-relaxed">
            Réception, validation, assignation aux équipes terrain, et suivi des interventions — un
            seul espace pour les agents de la commune.
          </p>
        </div>
        <p className="text-[11px] text-white/55">
          © {new Date().getFullYear()} Groupement des communes territoriales — Ouarzazate
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col">
        <div className="px-6 lg:px-8 py-5 flex items-center justify-between border-b border-gray-200">
          <Link
            to="/citizen"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Back className="size-4" />
            {t('dashboard.login.back')}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex-1 grid place-items-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <CommuneLogo size={48} />
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                  {t('common.communeFull')}
                </p>
                <p className="text-base font-bold text-gray-900">Ouarzazate</p>
              </div>
            </div>

            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {t('dashboard.login.title')}
            </h2>
            <p className="mt-2 text-gray-600">{t('dashboard.login.subtitle')}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                navigate('/dashboard')
              }}
              className="mt-9 space-y-5"
            >
              <label className="block">
                <span className="block text-sm font-semibold text-gray-800 mb-2">
                  {t('dashboard.login.email')}
                </span>
                <input
                  type="email"
                  className="input"
                  placeholder={t('dashboard.login.emailPlaceholder')}
                  defaultValue="agent@ouarzazate.ma"
                />
              </label>
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {t('dashboard.login.password')}
                  </span>
                  <a href="#" className="text-xs font-semibold text-olive-700 hover:text-olive-800">
                    {t('dashboard.login.forgot')}
                  </a>
                </div>
                <input type="password" className="input" defaultValue="azerty1234" />
              </label>

              <button type="submit" className="btn-square btn-square-red w-full">
                {t('dashboard.login.submit')}
              </button>
            </form>

            <p className="mt-8 text-xs text-gray-500 text-center">
              Accès réservé au personnel autorisé. Toute connexion est journalisée.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
