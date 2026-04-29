import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Truck } from 'lucide-react'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'

export function Login() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const Back = isRTL ? ChevronRight : ChevronLeft
  const navigate = useNavigate()

  return (
    <div className="min-h-svh bg-gray-100 grid place-items-center py-6 lg:py-10">
      <Link
        to="/"
        className="fixed bottom-4 start-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow hover:bg-gray-50"
      >
        <Back className="size-3.5" />
        Aperçu design
      </Link>

      <div className="w-full max-w-[420px] aspect-[420/900] bg-black rounded-[3rem] p-2.5 shadow-2xl">
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-white flex flex-col">
          <div className="absolute top-0 inset-x-0 z-50 h-7 bg-black grid place-items-center">
            <div className="h-5 w-32 rounded-full bg-black" />
          </div>

          <div className="flex-1 pt-12 px-7 flex flex-col">
            {/* Top */}
            <div className="flex items-center justify-between">
              <CommuneLogo size={48} />
              <LanguageSwitcher />
            </div>

            <div className="mt-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-50 text-olive-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                <Truck className="size-3" />
                {t('fieldTeam.login.team')}
              </span>
              <h1 className="mt-4 text-3xl font-black text-gray-900 tracking-tight">
                {t('fieldTeam.login.title')}
              </h1>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                {t('fieldTeam.login.subtitle')}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                navigate('/field-team')
              }}
              className="mt-9 space-y-4 flex-1 flex flex-col"
            >
              <label className="block">
                <span className="block text-sm font-semibold text-gray-800 mb-2">
                  {t('fieldTeam.login.email')}
                </span>
                <input type="email" className="input" defaultValue="m.tazi@ouarzazate.ma" />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-800 mb-2">
                  {t('fieldTeam.login.password')}
                </span>
                <input type="password" className="input" defaultValue="••••" />
              </label>

              <div className="mt-auto pt-6 pb-4">
                <button type="submit" className="btn-square btn-square-red w-full">
                  {t('fieldTeam.login.submit')}
                </button>
                <p className="mt-4 text-[11px] text-gray-500 text-center">
                  Plateforme · GCT Ouarzazate
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
