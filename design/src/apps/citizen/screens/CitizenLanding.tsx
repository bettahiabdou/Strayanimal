import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { LanguageSwitcher } from '@/design-system/LanguageSwitcher'
import { CommuneLogo } from '@/design-system/CommuneLogo'
import { cn } from '@/design-system/cn'

const HOTLINE_DISPLAY = '0524 88 24 87'
const HOTLINE_TEL = 'tel:+212524882487'
const WHATSAPP_URL = 'https://wa.me/212524882487'

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

  return (
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
  )
}

/* ----- TOP BAR (white, slim, utility info) ----- */
function TopBar() {
  const { t } = useTranslation()
  return (
    <div className="bg-white border-b border-gray-200 text-sm">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-9 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5 text-gray-500">
          <a href="#" aria-label="Facebook" className="hover:text-gray-900 transition-colors">
            <Facebook />
          </a>
          <a
            href={WHATSAPP_URL}
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
            href={HOTLINE_TEL}
            className="inline-flex items-center gap-2 hover:text-gray-900 transition-colors"
          >
            <span>
              {t('citizen.topbar.hotline')}:{' '}
              <strong className="text-gray-900">{HOTLINE_DISPLAY}</strong>
            </span>
          </a>
          <a
            href={`mailto:${t('citizen.topbar.email')}`}
            className="hidden md:inline-flex items-center gap-2 hover:text-gray-900 transition-colors"
          >
            <Mail className="size-3.5" /> {t('citizen.topbar.email')}
          </a>
          <a
            href={`mailto:${t('citizen.topbar.help')}`}
            className="hidden lg:inline-flex items-center gap-2 hover:text-gray-900 transition-colors"
          >
            <Mail className="size-3.5" /> {t('citizen.topbar.help')}
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
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-8 md:py-10">
        <div className="grid lg:grid-cols-12 gap-y-6 gap-x-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.16em] text-olive-700 font-bold">
              {t('citizen.topbar.hotline')} · 24h/24
            </p>
            <a
              href={HOTLINE_TEL}
              className="block mt-2 text-4xl md:text-5xl font-black text-red-600 hover:text-red-700 transition-colors leading-none tracking-tight"
            >
              {HOTLINE_DISPLAY}
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
              href={WHATSAPP_URL}
              className="btn-square bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
            <a href={HOTLINE_TEL} className="btn-square btn-square-outline">
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
  return (
    <section id="attention" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 grid md:grid-cols-2 gap-x-14 gap-y-10">
        <BilingualColumn lang="fr" title="ATTENTION !" t={t} />
        <BilingualColumn lang="ar" title="تنبيه!" t={t} />
      </div>
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a href={WHATSAPP_URL} className="btn-square bg-green-500 hover:bg-green-600 text-white">
          <MessageCircle className="size-4" />
          {t('citizen.attention.ctaWhatsapp')}
        </a>
        <a href={HOTLINE_TEL} className="btn-square btn-square-red">
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
}: {
  lang: 'fr' | 'ar'
  title: string
  t: ReturnType<typeof useTranslation>['t']
}) {
  const get = (k: string) => t(k, { lng: lang, hotline: HOTLINE_DISPLAY })
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

function ReportForm() {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState<string | null>(null)

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
          <button
            onClick={() => {
              setSubmitted(null)
              setStep(1)
            }}
            className="btn-square btn-square-outline"
          >
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

      {step === 1 ? <Step1 /> : <Step2 />}

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
            onClick={() => {
              const ref =
                'OZN-' + String(Date.now()).slice(-4) + '-' + Math.floor(Math.random() * 90 + 10)
              setSubmitted(ref)
            }}
            className="btn-square btn-square-red"
          >
            {t('citizen.form.submit')}
            <CheckCircle2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function Step1() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <Field label={t('citizen.form.fields.category')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['categoryAggressive', 'categoryInjured', 'categoryStray'] as const).map((k, i) => (
            <RadioCard
              key={k}
              name="category"
              value={k}
              defaultChecked={i === 1}
              label={t(`citizen.form.fields.${k}`)}
            />
          ))}
        </div>
      </Field>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={t('citizen.form.fields.animalType')}>
          <select className="select" defaultValue="dog">
            <option value="dog">{t('citizen.form.fields.animalDog')}</option>
            <option value="cat">{t('citizen.form.fields.animalCat')}</option>
            <option value="other">{t('citizen.form.fields.animalOther')}</option>
          </select>
        </Field>
        <Field label={t('citizen.form.fields.animalCount')}>
          <input className="input" type="number" min={1} defaultValue={1} />
        </Field>
      </div>
      <Field label={t('citizen.form.fields.photo')} hint={t('citizen.form.fields.photoHint')}>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-red-500 rounded-lg py-10 cursor-pointer transition-colors text-gray-500 hover:text-red-600">
          <Upload className="size-7" />
          <span className="text-sm font-medium">{t('citizen.form.fields.photoUpload')}</span>
          <input type="file" accept="image/*" className="sr-only" />
        </label>
      </Field>
      <Field label={t('citizen.form.fields.description')}>
        <textarea
          className="textarea"
          placeholder={t('citizen.form.fields.descriptionPlaceholder')}
        />
      </Field>
    </div>
  )
}

function Step2() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <Field label={t('citizen.form.fields.address')}>
        <div className="relative">
          <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            className="input ps-10"
            placeholder={t('citizen.form.fields.addressPlaceholder')}
          />
        </div>
      </Field>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={t('citizen.form.fields.availableTime')}>
          <select className="select">
            <option>{t('citizen.form.fields.timeMorning')}</option>
            <option>{t('citizen.form.fields.timeAfternoon')}</option>
            <option>{t('citizen.form.fields.timeEvening')}</option>
            <option>{t('citizen.form.fields.timeNight')}</option>
          </select>
        </Field>
        <Field label={t('citizen.form.fields.environment')}>
          <select className="select">
            <option>{t('citizen.form.fields.envResidential')}</option>
            <option>{t('citizen.form.fields.envCommercial')}</option>
            <option>{t('citizen.form.fields.envPublic')}</option>
            <option>{t('citizen.form.fields.envRoad')}</option>
          </select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-5 pt-3 border-t border-gray-200">
        <Field label={t('citizen.form.fields.contactName')}>
          <input className="input" />
        </Field>
        <Field
          label={t('citizen.form.fields.contactPhone')}
          hint={t('citizen.form.fields.contactPhoneHint')}
        >
          <input className="input" type="tel" />
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
  defaultChecked,
}: {
  name: string
  value: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
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
              <a href={HOTLINE_TEL} className="hover:text-white">
                {HOTLINE_DISPLAY}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="size-4 text-gray-400 mt-0.5 shrink-0" />
              <a href={`mailto:${t('citizen.topbar.email')}`} className="hover:text-white">
                {t('citizen.topbar.email')}
              </a>
            </li>
            <li className="flex items-start gap-2 mt-4">
              <MapPin className="size-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="whitespace-pre-line">{t('citizen.footer.address')}</span>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
            {t('citizen.footer.openingHoursTitle')}
          </p>
          <p className="whitespace-pre-line text-sm text-gray-400">
            {t('citizen.footer.openingHours')}
          </p>
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
  return (
    <div className="fixed bottom-6 end-4 z-40 flex flex-col gap-2.5">
      <a
        href={HOTLINE_TEL}
        aria-label="Call"
        className="size-12 rounded-full bg-green-500 hover:bg-green-600 grid place-items-center text-white shadow-lg shadow-black/20 transition-colors"
      >
        <Phone className="size-5" />
      </a>
      <a
        href={WHATSAPP_URL}
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
