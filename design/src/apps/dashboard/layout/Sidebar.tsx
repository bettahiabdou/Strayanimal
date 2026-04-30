import { NavLink, useNavigate } from 'react-router-dom'
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
  X,
} from 'lucide-react'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { cn } from '@/design-system/cn'
import { useAuth } from '@/lib/auth-context'

type NavItem = {
  to: string
  icon: typeof LayoutDashboard
  key: string
  end?: boolean
  badge?: number
}

const items: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'overview', end: true },
  { to: '/dashboard/triage', icon: Inbox, key: 'triage' },
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

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Map UserRole → existing dashboard.users.role.* i18n keys. */
const ROLE_KEY: Record<string, string> = {
  ADMIN: 'dashboard.users.role.admin',
  SUPERVISOR: 'dashboard.users.role.supervisor',
  AGENT: 'dashboard.users.role.agent',
  FIELD_TEAM: 'dashboard.users.role.fieldTeam',
}

type Props = {
  /** True when the off-canvas drawer should be visible (mobile only). */
  mobileOpen: boolean
  /** Called to close the drawer. Wired to backdrop click + close button + nav clicks. */
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const onLogout = async () => {
    await logout()
    navigate('/dashboard/login', { replace: true })
  }

  return (
    <>
      {/* Backdrop — only ever rendered on <lg, only when the drawer is open.
       *
       * z-[1100] so it sits above Leaflet's internal chrome (controls = 1000,
       * popups = 700, tooltips = 650). Without this the map's +/- buttons,
       * its © OpenStreetMap bar, and even the tile pane render *over* the
       * drawer when it's opened from /dashboard/map on mobile.
       */}
      <button
        type="button"
        aria-label={t('dashboard.sidebar.closeMenu')}
        onClick={onMobileClose}
        className={cn(
          'lg:hidden fixed inset-0 z-[1100] bg-black/50 backdrop-blur-[1px] transition-opacity',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Sidebar
       *
       * On lg+: sticky left rail, always visible.
       * On <lg: fixed off-canvas drawer, slid out by default, slides in when
       *         mobileOpen is true. The translate uses RTL-aware logic.
       *         z-[1200] so the drawer panel itself sits above Leaflet's
       *         chrome — same reason as the backdrop above.
       */}
      <aside
        className={cn(
          'bg-olive-800 text-white w-64 shrink-0 flex flex-col border-e border-olive-900',
          // Desktop layout — sticky in the page flow
          'lg:sticky lg:top-0 lg:h-svh',
          // Mobile layout — fixed drawer
          'fixed inset-y-0 start-0 z-[1200] transition-transform duration-200 lg:transition-none',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0',
        )}
      >
        {/* Brand + close button (close only visible on <lg) */}
        <div className="p-5 flex items-center gap-3 border-b border-olive-700/60">
          <CommuneLogo size={42} />
          <div className="leading-tight min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
              {t('common.communeShort')}
            </p>
            <p className="text-sm font-bold text-white truncate">
              {t('dashboard.sidebar.tagline')}
            </p>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label={t('dashboard.sidebar.closeMenu')}
            className="lg:hidden size-9 grid place-items-center rounded-md hover:bg-olive-700 text-white/80 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {items.map(({ to, icon: Icon, key, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onMobileClose}
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
              {t('dashboard.sidebar.adminSection')}
            </p>
            {adminItems.map(({ to, icon: Icon, key }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onMobileClose}
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
            <div className="size-9 rounded-full bg-olive-600 grid place-items-center text-white text-sm font-bold shrink-0">
              {user ? initials(user.name) : '—'}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-sm font-semibold text-white truncate">{user?.name ?? '…'}</p>
              <p className="text-[11px] text-white/60 truncate">
                {user ? (ROLE_KEY[user.role] ? t(ROLE_KEY[user.role]!) : user.role) : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-white/60 hover:text-white shrink-0"
              aria-label={t('dashboard.nav.logout')}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
