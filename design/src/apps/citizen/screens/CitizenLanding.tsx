import { createContext, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { cn } from '@/design-system/cn'
import { api, ApiError, type PlatformSettings } from '@/lib/api'
import { MapPicker } from '../components/MapPicker'
import { PhotoPicker } from '../components/PhotoPicker'

/* ─────────── Platform settings (commune contact info) ───────────
 *
 * Loaded from GET /settings on mount. Fallback values match what the
 * page hard-coded before the settings table existed, so the citizen
 * site stays fully usable even if the API is unreachable.
 */

const DEFAULT_SETTINGS: PlatformSettings = {
  communeName: 'Groupement des communes territoriales — Ouarzazate',
  serviceTitle: 'Service de protection des animaux errants',
  publicHotline: '0524 88 24 87',
  internalHotline: '0524 88 50 12',
  publicEmail: 'info@animaux-ouarzazate.ma',
  address: 'Avenue Mohammed V, Ouarzazate 45000',
  openingHours: 'Lundi – Vendredi : 08h30 – 17h00\nWeek-end : urgences uniquement',
  updatedAt: '',
}

const SettingsCtx = createContext<PlatformSettings>(DEFAULT_SETTINGS)
function useSettings() {
  return useContext(SettingsCtx)
}

/** Hotline → +212XXXXXXXXX (drop spaces, drop leading 0, prepend +212). */
function hotlineToE164(display: string) {
  const digits = display.replace(/\D/g, '').replace(/^0/, '')
  return `+212${digits}`
}
function hotlineTel(display: string) {
  return `tel:${hotlineToE164(display)}`
}
function hotlineWhatsapp(display: string) {
  return `https://wa.me/${hotlineToE164(display).replace('+', '')}`
}

/* ----------------------------------------------------------
 * Photos — swap any of these URLs with your own.
 * Best: drop your own files into design/public/ and reference
 * them as "/your-file.jpg".
 * HERO = a Ouarzazate landmark / city scene (place identity)
 * ---------------------------------------------------------- */
const HERO_PLACE = '/hero.jpg'
const Facebook = ({ className = 'size-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07C2 17.09 5.66 21.25 10.44 22v-7.03H7.9v-2.9h2.54V9.84c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.77l-.44 2.9h-2.33V22C18.34 21.25 22 17.09 22 12.07Z" />
  </svg>
)
const Instagram = ({ className = 'size-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export function CitizenLanding() {
  const { i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS)

  // Public endpoint — no auth needed. Failure is non-fatal: we keep DEFAULT_SETTINGS.
  useEffect(() => {
    let cancelled = false
    api
      .getSettings()
      .then(({ settings }) => {
        if (!cancelled) setSettings(settings)
      })
      .catch(() => {
        /* keep defaults */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SettingsCtx.Provider value={settings}>
      <div className="bg-white text-gray-900 min-h-svh flex flex-col">
        <TopBar />
        <SiteHeader />
        <HeroBanner />
        <ActionStrip />
        <AboutSection />
        <AttentionSection />
        <FormSection />
        <SiteFooter />
        <FloatingActions />
        <BackToHubLink isRTL={isRTL} />
      </div>
    </SettingsCtx.Provider>
  )
}

/* ----- TOP BAR (white, slim, utility info) ----- */
function TopBar() {
  const { t } = useTranslation()
  const { publicHotline, publicEmail } = useSettings()
  return (
    <div className="bg-white border-b border-gray-200 text-sm">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-9 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5 text-gray-500">
          <a href="#" aria-label="Facebook" className="hover:text-gray-900 transition-colors">
            <Facebook />
          </a>
          <a
            href={hotlineWhatsapp(publicHotline)}
            aria-label="WhatsApp"
            className="hover:text-gray-900 transition-colors"
          >
            <MessageCircle className="size-3.5" />
          </a>
          <a href="#" aria-label="Instagram" className="hover:text-gray-900 transition-colors">
            <Instagram />
          </a>
        </div>
        <div className="flex items-center gap-x-6 gap-y-1 flex-wrap text-[12.5px] text-gray-600">
          <a
            href={hotlineTel(publicHotline)}
            className="inline-flex items-center gap-2 hover:text-gray-900 transition-colors"
          >
            <span>
              {t('citizen.topbar.hotline')}:{' '}
              <strong className="text-gray-900">{publicHotline}</strong>
            </span>
          </a>
          <a
            href={`mailto:${publicEmail}`}
            className="hidden md:inline-flex items-center gap-2 hover:text-gray-900 transition-colors"
          >
            <Mail className="size-3.5" /> {publicEmail}
          </a>
        </div>
      </div>
    </div>
  )
}

/* ----- SITE HEADER (olive green, sticky, logo + nav + red CTA) ----- */
function SiteHeader() {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 bg-olive-700 text-white shadow-sm">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-20 flex items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-3 shrink-0">
          <CommuneLogo size={56} />
          <div className="leading-tight hidden sm:block">
            <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
              {t('common.communeFull')}
            </p>
            <p className="text-[15px] font-bold text-white">Ouarzazate</p>
          </div>
        </a>
        <nav className="hidden lg:flex items-center gap-9 text-[14px] font-bold uppercase tracking-wide">
          <a href="#top" className="text-white border-b-2 border-white pb-0.5">
            {t('citizen.nav.home')}
          </a>
          <a href="#attention" className="text-white/85 hover:text-white transition-colors">
            {t('citizen.nav.report')}
          </a>
          <a href="#form" className="text-white/85 hover:text-white transition-colors">
            {t('citizen.nav.form')}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher tone="dark" className="hidden sm:inline-flex" />
          <a href="#form" className="btn-square btn-square-red">
            {t('citizen.nav.reportNow')}
          </a>
        </div>
      </div>
    </header>
  )
}

/* ----- HERO BANNER (Ouarzazate place photo, title at bottom) ----- */
function HeroBanner() {
  const { t } = useTranslation()
  return (
    <section id="top" className="relative">
      {/* Banner photo */}
      <div className="relative h-[64svh] min-h-[540px] max-h-[700px] w-full overflow-hidden">
        <img src={HERO_PLACE} alt="Ouarzazate" className="size-full object-cover" loading="eager" />
        {/* Light overall darkening so any glass panel reads cleanly */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Title in a frosted-glass panel */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-[1400px] px-4 lg:px-8 pb-8 md:pb-12">
            <div className="bg-black/35 backdrop-blur-md ring-1 ring-white/15 rounded-md p-7 md:p-10 max-w-3xl text-white shadow-2xl">
              <p className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-white/85 font-semibold">
                {t('common.communeFull')} — Ouarzazate
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
                {t('citizen.hero.title')}
              </h1>
              <p className="mt-4 italic text-white/90 text-base md:text-lg">
                {t('citizen.hero.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----- ACTION STRIP (hotline + CTAs, white bg, separated from banner) ----- */
function ActionStrip() {
  const { t } = useTranslation()
  const { publicHotline } = useSettings()
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-8 md:py-10">
        <div className="grid lg:grid-cols-12 gap-y-6 gap-x-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.16em] text-olive-700 font-bold">
              {t('citizen.topbar.hotline')} · 24h/24
            </p>
            <a
              href={hotlineTel(publicHotline)}
              className="block mt-2 text-4xl md:text-5xl font-black text-red-600 hover:text-red-700 transition-colors leading-none tracking-tight"
            >
              {publicHotline}
            </a>
          </div>
          <div className="lg:col-span-7 flex flex-wrap gap-3 lg:justify-end">
            <a href="#form" className="btn-square btn-square-red">
              <AlertCircle className="size-4" />
              {t('citizen.nav.reportNow')}
              <ChevronRight className="size-4 rtl:hidden" />
              <ChevronLeft className="size-4 hidden rtl:inline" />
            </a>
            <a
              href={hotlineWhatsapp(publicHotline)}
              className="btn-square bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
            <a href={hotlineTel(publicHotline)} className="btn-square btn-square-outline">
              <Phone className="size-4" />
              {t('citizen.attention.ctaCall')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----- ABOUT (plain text, no photos, no decoration) ----- */
function AboutSection() {
  const { t } = useTranslation()
  return (
    <section className="bg-white border-b border-gray-200 py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 grid lg:grid-cols-12 gap-x-12 gap-y-8">
        <div className="lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.16em] text-olive-700 font-bold">
            {t('citizen.about.kicker')}
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
            {t('citizen.about.title')}
          </h2>
        </div>
        <div className="lg:col-span-8 space-y-5 text-gray-700 text-[15.5px] leading-[1.8]">
          <p>{t('citizen.about.p1')}</p>
          <p>{t('citizen.about.p2')}</p>
          <p>{t('citizen.about.p3')}</p>
        </div>
      </div>
    </section>
  )
}

/* ----- ATTENTION (bilingual side-by-side, white bg, red headers) ----- */
function AttentionSection() {
  const { t } = useTranslation()
  const { publicHotline } = useSettings()
  return (
    <section id="attention" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 grid md:grid-cols-2 gap-x-14 gap-y-10">
        <BilingualColumn lang="fr" title="ATTENTION !" t={t} hotline={publicHotline} />
        <BilingualColumn lang="ar" title="تنبيه!" t={t} hotline={publicHotline} />
      </div>
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={hotlineWhatsapp(publicHotline)}
          className="btn-square bg-green-500 hover:bg-green-600 text-white"
        >
          <MessageCircle className="size-4" />
          {t('citizen.attention.ctaWhatsapp')}
        </a>
        <a href={hotlineTel(publicHotline)} className="btn-square btn-square-red">
          <Phone className="size-4" />
          {t('citizen.attention.ctaCall')}
        </a>
      </div>
    </section>
  )
}

function BilingualColumn({
  lang,
  title,
  t,
  hotline,
}: {
  lang: 'fr' | 'ar'
  title: string
  t: ReturnType<typeof useTranslation>['t']
  hotline: string
}) {
  const get = (k: string) => t(k, { lng: lang, hotline })
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const align = lang === 'ar' ? 'text-right' : 'text-left'
  const fontFamily = lang === 'ar' ? 'font-arabic' : ''
  return (
    <div dir={dir} className={cn(align, fontFamily)}>
      <h2 className="text-3xl md:text-5xl font-black text-red-600 tracking-tight">{title}</h2>
      <div className="mt-7 space-y-4 text-gray-700 leading-[1.85] text-[15px] md:text-base text-justify">
        <p>
          <Markdown>{get('citizen.attention.p1')}</Markdown>
        </p>
        <p>
          <Markdown>{get('citizen.attention.p2')}</Markdown>
        </p>
        <p>
          <Markdown>{get('citizen.attention.p3')}</Markdown>
        </p>
      </div>
    </div>
  )
}

function Markdown({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\*\*(.+)\*\*$/)
        if (m)
          return (
            <strong key={i} className="text-gray-900 font-bold">
              {m[1]}
            </strong>
          )
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

/* ----- FORM (bilingual title + multi-step) ----- */
function FormSection() {
  const { t } = useTranslation()
  return (
    <section id="form" className="py-20 md:py-28 bg-gray-50 border-y border-gray-200">
      <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">
          <span dir="ltr">{t('citizen.form.title', { lng: 'fr' })}</span>
          <span className="text-gray-400 mx-3">-</span>
          <span dir="rtl" className="font-arabic">
            {t('citizen.form.title', { lng: 'ar' })}
          </span>
        </h2>
        <p className="mt-4 text-gray-600">
          <span dir="rtl" className="font-arabic block">
            {t('citizen.form.subtitle', { lng: 'ar' })}
          </span>
          <span dir="ltr" className="block">
            {t('citizen.form.subtitle', { lng: 'fr' })}
          </span>
        </p>
      </div>
      <div className="mx-auto max-w-3xl px-4 lg:px-8 mt-10">
        <ReportForm />
      </div>
    </section>
  )
}

const TOTAL_STEPS = 2

type Category = 'AGGRESSIVE' | 'INJURED' | 'STRAY'
type AnimalType = 'DOG' | 'CAT' | 'OTHER'
type Coords = { lat: number; lng: number }
type FormState = {
  category: Category
  animalType: AnimalType
  animalCount: number
  comment: string
  address: string
  coords: Coords | null
  /** Photos as data URLs (data:image/jpeg;base64,...). */
  photos: string[]
  contactName: string
  contactPhone: string
}

const INITIAL: FormState = {
  category: 'INJURED',
  animalType: 'DOG',
  animalCount: 1,
  comment: '',
  address: '',
  coords: null,
  photos: [],
  contactName: '',
  contactPhone: '',
}

function ReportForm() {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormState>(INITIAL)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setData((d) => ({ ...d, [k]: v }))

  function reset() {
    setSubmitted(null)
    setData(INITIAL)
    setStep(1)
    setError(null)
  }

  async function onSubmit() {
    // Step-1 fields
    if (!data.comment.trim()) {
      setError('Veuillez décrire la situation.')
      setStep(1)
      return
    }
    // Step-2 fields
    if (!data.address.trim()) {
      setError('Veuillez préciser l’adresse.')
      setStep(2)
      return
    }
    if (!data.coords) {
      setError('Position introuvable. Cliquez sur la carte pour placer un repère.')
      setStep(2)
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const report = await api.submitReport({
        category: data.category,
        animalType: data.animalType,
        animalCount: data.animalCount,
        latitude: data.coords.lat,
        longitude: data.coords.lng,
        address: data.address.trim(),
        zone: data.address.trim().split(',')[0]?.trim() || data.address.trim(),
        comment: data.comment.trim(),
        citizenName: data.contactName.trim() || undefined,
        citizenPhone: data.contactPhone.trim() || undefined,
        preferredLocale: i18n.language === 'ar' ? 'ar' : 'fr',
        photos: data.photos.length ? data.photos : undefined,
      })
      setSubmitted(report.publicRef)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Connexion impossible. Réessayez plus tard.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-10 md:p-14 text-center shadow-sm">
        <CheckCircle2 className="size-14 text-green-500 mx-auto" strokeWidth={1.5} />
        <h3 className="mt-5 text-2xl font-bold">{t('citizen.success.title')}</h3>
        <p className="mt-3 text-gray-600 max-w-md mx-auto">{t('citizen.success.subtitle')}</p>
        <div className="mt-6 inline-flex flex-col items-center bg-gray-50 border border-gray-200 rounded-md px-6 py-4">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            {t('citizen.success.reference')}
          </span>
          <span className="font-mono text-xl font-bold text-gray-900 mt-1">{submitted}</span>
        </div>
        <div className="mt-8">
          <button onClick={reset} className="btn-square btn-square-outline">
            {t('citizen.success.newReport')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-10 shadow-sm">
      <div className="mb-8">
        <p className="text-sm font-semibold text-gray-700">
          {t('citizen.form.stepLabel', { current: step, total: TOTAL_STEPS })}
          <span className="text-gray-400 font-normal ms-2">
            · {step === 1 ? t('citizen.form.step1') : t('citizen.form.step2')}
          </span>
        </p>
        <div className="mt-3 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 ? <Step1 data={data} update={update} /> : <Step2 data={data} update={update} />}

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm"
        >
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-gray-200 pt-6">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="btn-square btn-square-outline">
            <ChevronLeft className="size-4 rtl:hidden" />
            <ChevronRight className="size-4 hidden rtl:inline" />
            {t('citizen.form.back')}
          </button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS ? (
          <button onClick={() => setStep(step + 1)} className="btn-square btn-square-red">
            {t('citizen.form.next')}
            <ChevronRight className="size-4 rtl:hidden" />
            <ChevronLeft className="size-4 hidden rtl:inline" />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="btn-square btn-square-red disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {submitting ? 'Envoi…' : t('citizen.form.submit')}
          </button>
        )}
      </div>
    </div>
  )
}

type StepProps = {
  data: FormState
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void
}

function Step1({ data, update }: StepProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <Field label={t('citizen.form.fields.category')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(
            [
              ['AGGRESSIVE', 'categoryAggressive'],
              ['INJURED', 'categoryInjured'],
              ['STRAY', 'categoryStray'],
            ] as const
          ).map(([value, i18nKey]) => (
            <RadioCard
              key={value}
              name="category"
              value={value}
              checked={data.category === value}
              onChange={() => update('category', value)}
              label={t(`citizen.form.fields.${i18nKey}`)}
            />
          ))}
        </div>
      </Field>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={t('citizen.form.fields.animalType')}>
          <select
            className="select"
            value={data.animalType}
            onChange={(e) => update('animalType', e.target.value as AnimalType)}
          >
            <option value="DOG">{t('citizen.form.fields.animalDog')}</option>
            <option value="CAT">{t('citizen.form.fields.animalCat')}</option>
            <option value="OTHER">{t('citizen.form.fields.animalOther')}</option>
          </select>
        </Field>
        <Field label={t('citizen.form.fields.animalCount')}>
          <input
            className="input"
            type="number"
            min={1}
            value={data.animalCount}
            onChange={(e) => update('animalCount', Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
      </div>
      <PhotoPicker
        label={t('citizen.form.fields.photo')}
        uploadLabel={t('citizen.form.fields.photoUpload')}
        hint={t('citizen.form.fields.photoHint')}
        value={data.photos}
        onChange={(next) => update('photos', next)}
      />
      <Field label={t('citizen.form.fields.description')}>
        <textarea
          className="textarea"
          placeholder={t('citizen.form.fields.descriptionPlaceholder')}
          value={data.comment}
          onChange={(e) => update('comment', e.target.value)}
          required
        />
      </Field>
    </div>
  )
}

function Step2({ data, update }: StepProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <Field label={t('citizen.form.fields.address')}>
        <div className="relative">
          <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            className="input ps-10"
            placeholder={t('citizen.form.fields.addressPlaceholder')}
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            required
          />
        </div>
      </Field>

      <Field label="Position sur la carte">
        <MapPicker value={data.coords} onChange={(c) => update('coords', c)} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5 pt-3 border-t border-gray-200">
        <Field label={t('citizen.form.fields.contactName')}>
          <input
            className="input"
            value={data.contactName}
            onChange={(e) => update('contactName', e.target.value)}
          />
        </Field>
        <Field
          label={t('citizen.form.fields.contactPhone')}
          hint={t('citizen.form.fields.contactPhoneHint')}
        >
          <input
            className="input"
            type="tel"
            value={data.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)}
          />
        </Field>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-800 mb-2">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1.5">{hint}</span>}
    </label>
  )
}

function RadioCard({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string
  value: string
  label: string
  checked?: boolean
  onChange?: () => void
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div className="border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 text-center hover:border-gray-400 peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:text-red-700 peer-focus-visible:ring-2 peer-focus-visible:ring-red-200 transition-all">
        {label}
      </div>
    </label>
  )
}

/* ----- FOOTER ----- */
function SiteFooter() {
  const { t } = useTranslation()
  const { publicHotline, publicEmail, address, openingHours } = useSettings()
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto border-t-4 border-olive-600">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-14 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <CommuneLogo size={56} />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                {t('common.communeFull')}
              </p>
              <p className="text-base font-bold text-white">Ouarzazate</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400">
            {t('citizen.footer.tagline')}
          </p>
          <div className="mt-5">
            <LanguageSwitcher tone="dark" />
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
            {t('citizen.footer.contactTitle')}
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Phone className="size-4 text-gray-400 mt-0.5 shrink-0" />
              <a href={hotlineTel(publicHotline)} className="hover:text-white">
                {publicHotline}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="size-4 text-gray-400 mt-0.5 shrink-0" />
              <a href={`mailto:${publicEmail}`} className="hover:text-white">
                {publicEmail}
              </a>
            </li>
            <li className="flex items-start gap-2 mt-4">
              <MapPin className="size-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="whitespace-pre-line">{address}</span>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
            {t('citizen.footer.openingHoursTitle')}
          </p>
          <p className="whitespace-pre-line text-sm text-gray-400">{openingHours}</p>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mt-6 mb-3">
            {t('citizen.footer.linksTitle')}
          </p>
          <ul className="grid grid-cols-2 gap-y-1 gap-x-3 text-sm">
            <li>
              <a href="#" className="hover:text-white">
                {t('citizen.footer.about')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                {t('citizen.footer.privacy')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                {t('citizen.footer.terms')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                {t('citizen.footer.contactPage')}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-5 text-xs text-gray-500">
          {t('citizen.footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  )
}

/* ----- FLOATING ACTIONS (right side) ----- */
function FloatingActions() {
  const { publicHotline } = useSettings()
  return (
    <div className="fixed bottom-6 end-4 z-40 flex flex-col gap-2.5">
      <a
        href={hotlineTel(publicHotline)}
        aria-label="Call"
        className="size-12 rounded-full bg-green-500 hover:bg-green-600 grid place-items-center text-white shadow-lg shadow-black/20 transition-colors"
      >
        <Phone className="size-5" />
      </a>
      <a
        href={hotlineWhatsapp(publicHotline)}
        aria-label="WhatsApp"
        className="size-12 rounded-full bg-green-500 hover:bg-green-600 grid place-items-center text-white shadow-lg shadow-black/20 transition-colors"
      >
        <MessageCircle className="size-5" />
      </a>
      <a
        href="#"
        aria-label="Instagram"
        className="size-12 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 hover:opacity-90 grid place-items-center text-white shadow-lg shadow-black/20 transition-opacity"
      >
        <Instagram className="size-5" />
      </a>
    </div>
  )
}

function BackToHubLink({ isRTL }: { isRTL: boolean }) {
  return (
    <Link
      to="/"
      className="fixed bottom-6 start-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow hover:bg-gray-50"
    >
      {isRTL ? '→' : '←'} Aperçu design
    </Link>
  )
}
