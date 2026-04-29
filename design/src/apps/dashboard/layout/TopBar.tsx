import { Bell, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'

export function TopBar() {
  const { t } = useTranslation()
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('dashboard.topbar.search')}
            className="w-full bg-gray-50 border border-gray-200 rounded-md ps-10 pe-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-olive-500 focus:ring-2 focus:ring-olive-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-5">
          <span className="hidden lg:inline-block text-xs text-gray-500 font-medium first-letter:uppercase">
            {today}
          </span>
          <LanguageSwitcher />
          <button
            aria-label={t('dashboard.topbar.notifications')}
            className="relative size-10 rounded-md hover:bg-gray-100 grid place-items-center text-gray-600 transition-colors"
          >
            <Bell className="size-5" strokeWidth={1.75} />
            <span className="absolute top-2 end-2 size-2 rounded-full bg-red-600 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  )
}
