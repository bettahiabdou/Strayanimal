import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Inbox, Clock, User, Wifi, ChevronLeft } from 'lucide-react'
import { cn } from '@/design-system/cn'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'
import { CURRENT_AGENT } from '../data/mockMissions'

export function MobileShell() {
  return (
    <div className="min-h-svh bg-gray-100 grid place-items-center py-6 lg:py-10">
      <Link
        to="/"
        className="fixed bottom-4 start-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow hover:bg-gray-50"
      >
        <ChevronLeft className="size-3.5 rtl:rotate-180" />
        Aperçu design
      </Link>

      {/* Phone frame for desktop preview */}
      <div className="w-full max-w-[420px] aspect-[420/900] bg-black rounded-[3rem] p-2.5 shadow-2xl">
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-gray-50">
          {/* Notch */}
          <div className="absolute top-0 inset-x-0 z-50 h-7 bg-black grid place-items-center">
            <div className="h-5 w-32 rounded-full bg-black ring-1 ring-gray-800" />
          </div>

          {/* Inner phone content with top bar + outlet + bottom nav */}
          <div className="h-full w-full pt-7 flex flex-col">
            <TopAppBar />
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <Outlet />
            </main>
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}

function TopAppBar() {
  const { t } = useTranslation()
  return (
    <header className="bg-olive-700 text-white">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 font-semibold">
            {CURRENT_AGENT.team}
          </p>
          <p className="text-sm font-bold truncate">{CURRENT_AGENT.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher tone="dark" className="text-xs" />
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-900/40 rounded-full px-2 py-0.5">
            <Wifi className="size-3" />
            {t('fieldTeam.shell.online')}
          </span>
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  const { t } = useTranslation()
  type Tab = { to: string; icon: typeof Inbox; key: string; end?: boolean }
  const items: Tab[] = [
    { to: '/field-team', icon: Inbox, key: 'inbox', end: true },
    { to: '/field-team/history', icon: Clock, key: 'history' },
    { to: '/field-team/profile', icon: User, key: 'profile' },
  ]
  return (
    <nav className="bg-white border-t border-gray-200 grid grid-cols-3 px-1 pt-1 pb-2">
      {items.map(({ to, icon: Icon, key, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 py-2 rounded-md transition-colors',
              isActive ? 'text-olive-700' : 'text-gray-400',
            )
          }
        >
          <Icon className="size-5" strokeWidth={2.25} />
          <span className="text-[11px] font-semibold">{t(`fieldTeam.tabs.${key}`)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
