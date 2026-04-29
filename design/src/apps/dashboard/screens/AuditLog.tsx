import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Download,
  ScrollText,
  ShieldCheck,
  FileText,
  Users as UsersIcon,
  Settings as SettingsIcon,
  UserCog,
} from 'lucide-react'
import { MOCK_AUDIT, type AuditEntry, type AuditCategory } from '../data/mockUsers'
import { cn } from '@/design-system/cn'

const CATEGORY_ICON: Record<AuditCategory, typeof FileText> = {
  auth: ShieldCheck,
  report: FileText,
  team: UsersIcon,
  settings: SettingsIcon,
  user: UserCog,
}

const CATEGORY_TONE: Record<AuditCategory, string> = {
  auth: 'bg-violet-50 text-violet-700 border-violet-200',
  report: 'bg-olive-50 text-olive-800 border-olive-200',
  team: 'bg-orange-50 text-orange-700 border-orange-200',
  settings: 'bg-blue-50 text-blue-700 border-blue-200',
  user: 'bg-rose-50 text-rose-700 border-rose-200',
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDateGroup(iso: string, t: ReturnType<typeof useTranslation>['t']) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000)
  if (d.toDateString() === today.toDateString()) return t('dashboard.audit.today')
  if (d.toDateString() === yesterday.toDateString()) return t('dashboard.audit.yesterday')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

type Filter = 'all' | AuditCategory

export function AuditLog() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let rows: AuditEntry[] = MOCK_AUDIT
    if (filter !== 'all') rows = rows.filter((e) => e.category === filter)
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      rows = rows.filter(
        (e) =>
          e.user.name.toLowerCase().includes(s) ||
          e.action.toLowerCase().includes(s) ||
          (e.target ?? '').toLowerCase().includes(s),
      )
    }
    return rows
  }, [filter, search])

  // Group by day
  const groups = useMemo(() => {
    const map = new Map<string, AuditEntry[]>()
    for (const entry of filtered) {
      const key = fmtDateGroup(entry.at, t)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    return Array.from(map.entries())
  }, [filtered, t])

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight inline-flex items-center gap-2">
            <ScrollText className="size-6 text-olive-700" />
            {t('dashboard.audit.title')}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">{t('dashboard.audit.subtitle')}</p>
        </div>
        <button className="btn-square btn-square-outline">
          <Download className="size-4" />
          {t('dashboard.audit.export')}
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-md flex flex-wrap items-center gap-3 p-3">
        <div className="flex flex-wrap gap-1">
          {(['all', 'auth', 'report', 'team', 'settings', 'user'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
                filter === f ? 'bg-olive-700 text-white' : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {t(`dashboard.audit.filters.${f}`)}
            </button>
          ))}
        </div>
        <div className="ms-auto relative w-full md:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.audit.search')}
            className="w-full bg-white border border-gray-200 rounded-md ps-9 pe-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {t('dashboard.audit.showing', { count: filtered.length })}
        </span>
      </div>

      {/* Grouped log */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {groups.map(([day, rows]) => (
          <section key={day}>
            <div className="bg-gray-50 px-5 py-2 border-y border-gray-200 first:border-t-0 sticky top-16 z-10">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold first-letter:uppercase">
                {day}
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {rows.map((entry) => {
                const Icon = CATEGORY_ICON[entry.category]
                return (
                  <li
                    key={entry.id}
                    className="px-5 py-3 grid grid-cols-[auto_auto_1fr_auto] gap-x-5 items-start hover:bg-gray-50"
                  >
                    <span className="font-mono text-xs text-gray-500 pt-1 min-w-16 shrink-0">
                      {fmtDateTime(entry.at).split(', ')[1] ?? fmtDateTime(entry.at)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5 mt-1 whitespace-nowrap',
                        CATEGORY_TONE[entry.category],
                      )}
                    >
                      <Icon className="size-3" />
                      {t(`dashboard.audit.filters.${entry.category}`)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm">
                        <strong className="text-gray-900 font-semibold">{entry.user.name}</strong>{' '}
                        <span className="text-gray-700">{entry.action}</span>
                        {entry.target && (
                          <>
                            {' — '}
                            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-1 py-0.5 rounded">
                              {entry.target}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        <span className="font-mono">{entry.ip}</span> · {entry.agent}
                      </p>
                    </div>
                    {entry.tone === 'urgent' && (
                      <span className="text-[10px] font-bold uppercase text-red-600 mt-1">●</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
