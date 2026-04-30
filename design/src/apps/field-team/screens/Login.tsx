import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Truck, AlertCircle, Loader2 } from 'lucide-react'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'
import { useAuth } from '@/lib/auth-context'
import { ApiError } from '@/lib/api'

export function Login() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const Back = isRTL ? ChevronRight : ChevronLeft
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()

  const [email, setEmail] = useState('s.elidrissi@ouarzazate.ma')
  const [password, setPassword] = useState('azerty1234')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already authed → bounce to the right place.
  if (user) {
    if (user.role === 'FIELD_TEAM') {
      const target = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      return (
        <Navigate
          to={target && target.startsWith('/field-team') ? target : '/field-team'}
          replace
        />
      )
    }
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const u = await login(email.trim(), password)
      if (u.role !== 'FIELD_TEAM') {
        setError(
          "Ce compte n'appartient pas à une équipe terrain. Utilisez le tableau de bord à la place.",
        )
        setSubmitting(false)
        return
      }
      const target = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(target && target.startsWith('/field-team') ? target : '/field-team', {
        replace: true,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible. Réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

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

            <form onSubmit={onSubmit} className="mt-9 space-y-4 flex-1 flex flex-col">
              <label className="block">
                <span className="block text-sm font-semibold text-gray-800 mb-2">
                  {t('fieldTeam.login.email')}
                </span>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-800 mb-2">
                  {t('fieldTeam.login.password')}
                </span>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />
              </label>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-2.5 text-xs"
                >
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-auto pt-6 pb-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-square btn-square-red w-full"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
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
