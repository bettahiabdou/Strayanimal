import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit3,
  ShieldCheck,
  Eye,
  Truck,
  UserCheck,
  Users as UsersIcon,
  CheckCircle2,
} from 'lucide-react'
import { MOCK_USERS, type AppUser, type UserRole, type UserStatus } from '../data/mockUsers'
import { cn } from '@/design-system/cn'

const ROLE_META: Record<UserRole, { tone: string; icon: typeof ShieldCheck }> = {
  admin: { tone: 'bg-violet-50 text-violet-700 border-violet-200', icon: ShieldCheck },
  supervisor: { tone: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye },
  agent: { tone: 'bg-olive-50 text-olive-800 border-olive-200', icon: UserCheck },
  fieldTeam: { tone: 'bg-orange-50 text-orange-700 border-orange-200', icon: Truck },
}

const STATUS_TONE: Record<UserStatus, { dot: string; pill: string }> = {
  active: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
function avatarColor(name: string) {
  const colors = [
    'bg-olive-600',
    'bg-blue-600',
    'bg-orange-500',
    'bg-rose-600',
    'bg-violet-600',
    'bg-emerald-600',
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return colors[h % colors.length]
}
function fmtAgo(iso?: string) {
  if (!iso) return '—'
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 60) return `il y a ${diff} min`
  if (diff < 60 * 24) return `il y a ${Math.floor(diff / 60)} h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

type Filter = 'all' | UserRole

export function Users() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let rows: AppUser[] = MOCK_USERS
    if (filter !== 'all') rows = rows.filter((u) => u.role === filter)
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      rows = rows.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.zone ?? '').toLowerCase().includes(s),
      )
    }
    return rows
  }, [filter, search])

  const stats = {
    total: MOCK_USERS.length,
    active: MOCK_USERS.filter((u) => u.status === 'active').length,
    agents: MOCK_USERS.filter(
      (u) => u.role === 'agent' || u.role === 'supervisor' || u.role === 'admin',
    ).length,
    fieldTeam: MOCK_USERS.filter((u) => u.role === 'fieldTeam').length,
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t('dashboard.users.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.users.subtitle')}</p>
        </div>
        <button className="btn-square btn-square-red">
          <Plus className="size-4" />
          {t('dashboard.users.newUser')}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t('dashboard.users.kpi.total')}
          value={stats.total}
          icon={UsersIcon}
          bar="bg-olive-600"
          iconBg="bg-olive-50"
          iconColor="text-olive-700"
        />
        <KpiCard
          label={t('dashboard.users.kpi.active')}
          value={stats.active}
          icon={CheckCircle2}
          bar="bg-emerald-500"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label={t('dashboard.users.kpi.agents')}
          value={stats.agents}
          icon={UserCheck}
          bar="bg-blue-500"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          label={t('dashboard.users.kpi.fieldTeam')}
          value={stats.fieldTeam}
          icon={Truck}
          bar="bg-orange-500"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="flex flex-wrap items-center gap-3 p-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-1">
            {(['all', 'admin', 'supervisor', 'agent', 'fieldTeam'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
                  filter === f ? 'bg-olive-700 text-white' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {t(`dashboard.users.filters.${f}`)}
              </button>
            ))}
          </div>
          <div className="ms-auto relative w-full md:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('dashboard.users.search')}
              className="w-full bg-white border border-gray-200 rounded-md ps-9 pe-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-500/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                <Th className="ps-4">{t('dashboard.users.columns.user')}</Th>
                <Th>{t('dashboard.users.columns.role')}</Th>
                <Th>{t('dashboard.users.columns.zone')}</Th>
                <Th>{t('dashboard.users.columns.status')}</Th>
                <Th>{t('dashboard.users.columns.lastLogin')}</Th>
                <Th className="text-end pe-4">{t('dashboard.users.columns.actions')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-500">
                    {t('dashboard.users.noResults')}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const role = ROLE_META[u.role]
                  const RoleIcon = role.icon
                  const stat = STATUS_TONE[u.status]
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="ps-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'size-9 rounded-full grid place-items-center text-white text-xs font-bold',
                              avatarColor(u.name),
                            )}
                          >
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                            role.tone,
                          )}
                        >
                          <RoleIcon className="size-3" />
                          {t(`dashboard.users.role.${u.role}`)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700">{u.zone ?? '—'}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5',
                            stat.pill,
                          )}
                        >
                          <span className={cn('size-1.5 rounded-full', stat.dot)} />
                          {t(`dashboard.users.status.${u.status}`)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {fmtAgo(u.lastLogin)}
                      </td>
                      <td className="pe-4 py-3 text-end whitespace-nowrap">
                        <button
                          className="size-8 rounded-md hover:bg-gray-100 grid place-items-center text-gray-500 inline-grid"
                          aria-label="Modifier"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          className="size-8 rounded-md hover:bg-gray-100 grid place-items-center text-gray-500 inline-grid ms-1"
                          aria-label="Plus"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('text-start px-3 py-2.5 whitespace-nowrap', className)}>{children}</th>
}

function KpiCard({
  label,
  value,
  icon: Icon,
  bar,
  iconBg,
  iconColor,
}: {
  label: string
  value: number
  icon: typeof UsersIcon
  bar: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 relative overflow-hidden">
      <div className={cn('absolute top-0 inset-x-0 h-1', bar)} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
          <p className="mt-3 font-mono text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div
          className={cn('size-10 rounded-md grid place-items-center shrink-0', iconBg, iconColor)}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
