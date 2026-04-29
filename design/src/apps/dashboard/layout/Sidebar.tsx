import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Map,
  Users,
  BarChart3,
  Flame,
  UserCog,
  Settings,
  ScrollText,
  LogOut,
} from 'lucide-react'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { cn } from '@/design-system/cn'

type NavItem = {
  to: string
  icon: typeof LayoutDashboard
  key: string
  end?: boolean
  badge?: number
}

const items: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'overview', end: true },
  { to: '/dashboard/triage', icon: Inbox, key: 'triage', badge: 7 },
  { to: '/dashboard/reports', icon: FileText, key: 'reports' },
  { to: '/dashboard/map', icon: Map, key: 'map' },
  { to: '/dashboard/teams', icon: Users, key: 'teams' },
  { to: '/dashboard/stats', icon: BarChart3, key: 'stats' },
  { to: '/dashboard/heatmap', icon: Flame, key: 'heatmap' },
]

const adminItems: NavItem[] = [
  { to: '/dashboard/users', icon: UserCog, key: 'users' },
  { to: '/dashboard/settings', icon: Settings, key: 'settings' },
  { to: '/dashboard/audit', icon: ScrollText, key: 'audit' },
]

export function Sidebar() {
  const { t } = useTranslation()
  return (
    <aside className="bg-olive-800 text-white w-64 shrink-0 flex flex-col h-svh sticky top-0 border-e border-olive-900">
      {/* Brand */}
      <div className="p-5 flex items-center gap-3 border-b border-olive-700/60">
        <CommuneLogo size={42} />
        <div className="leading-tight min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
            {t('common.communeShort')}
          </p>
          <p className="text-sm font-bold text-white truncate">Animaux errants</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {items.map(({ to, icon: Icon, key, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-olive-700 text-white font-semibold'
                  : 'text-white/75 hover:text-white hover:bg-olive-700/60 font-medium',
              )
            }
          >
            <Icon className="size-4 shrink-0" strokeWidth={2} />
            <span className="flex-1">{t(`dashboard.nav.${key}`)}</span>
            {badge !== undefined && (
              <span className="bg-red-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5 leading-none">
                {badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-olive-700/60 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-white/45 font-semibold">
            Administration
          </p>
          {adminItems.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-olive-700 text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-olive-700/60 font-medium',
                )
              }
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              <span>{t(`dashboard.nav.${key}`)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-olive-700/60">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-9 rounded-full bg-olive-600 grid place-items-center text-white text-sm font-bold">
            MB
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-sm font-semibold text-white truncate">M. Belkadi</p>
            <p className="text-[11px] text-white/60 truncate">Agent communal</p>
          </div>
          <button className="text-white/60 hover:text-white" aria-label={t('dashboard.nav.logout')}>
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
