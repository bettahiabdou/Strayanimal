import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Truck, MapPin, Bell, Languages, Loader2 } from 'lucide-react'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { cn } from '@/design-system/cn'

export function Profile() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [push, setPush] = useState(true)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // Pull the team name from /missions/mine — it includes the team object.
  useEffect(() => {
    api
      .myMissions('active')
      .then((r) => setTeamName(r.team?.name ?? null))
      .catch(() => {
        /* leave as null */
      })
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/field-team/login', { replace: true })
    } catch {
      navigate('/field-team/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  function initials(name: string) {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="pb-4">
      {/* Hero — agent */}
      <section className="bg-gradient-to-b from-olive-700 to-olive-800 text-white px-5 pt-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-olive-600 grid place-items-center text-white text-xl font-black ring-4 ring-olive-500/40">
            {user ? initials(user.name) : '—'}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-semibold">
              {t('fieldTeam.profile.leadAgent')}
            </p>
            <h2 className="text-xl font-black truncate">{user?.name ?? '—'}</h2>
            <p className="text-xs text-white/85 inline-flex items-center gap-1.5">
              <Truck className="size-3" />
              {teamName ?? t('fieldTeam.shell.teamFallback')}
            </p>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="px-5 pt-4 space-y-3">
        <Card title={t('fieldTeam.profile.team')}>
          <Row icon={Truck} label={t('fieldTeam.profile.team')} value={teamName ?? '—'} />
          <Row icon={MapPin} label={t('fieldTeam.profile.zone')} value={user?.zone ?? '—'} />
        </Card>

        <Card title={t('fieldTeam.profile.preferences')}>
          <Row icon={Languages} label={t('fieldTeam.profile.language')}>
            <LanguageSwitcher className="text-xs" />
          </Row>
          <Row icon={Bell} label={t('fieldTeam.profile.notifications')}>
            <button
              type="button"
              onClick={() => setPush((v) => !v)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors shrink-0',
                push ? 'bg-olive-600' : 'bg-gray-300',
              )}
              aria-label={t('fieldTeam.profile.toggleNotificationsAria')}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 bg-white rounded-full shadow transition-all',
                  push ? 'start-[1.375rem]' : 'start-0.5',
                )}
              />
            </button>
          </Row>
        </Card>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn-square btn-square-outline w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
        >
          {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          {t('fieldTeam.profile.logout')}
        </button>

        <div className="pt-4 flex flex-col items-center text-center gap-2 text-[11px] text-gray-500">
          <CommuneLogo size={36} />
          <p className="font-semibold">{t('common.communeShort')}</p>
          <p>{t('fieldTeam.profile.version')}</p>
        </div>
      </section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <p className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
        {title}
      </p>
      <ul className="divide-y divide-gray-100">{children}</ul>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Bell
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <li className="px-4 py-3 flex items-center gap-3">
      <div className="size-8 rounded-md bg-olive-50 grid place-items-center text-olive-700 shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {value && <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>}
      </div>
      {children}
    </li>
  )
}
