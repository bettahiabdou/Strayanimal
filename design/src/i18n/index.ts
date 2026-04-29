import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

export const SUPPORTED_LANGUAGES = ['fr', 'ar'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const RTL_LANGUAGES: Language[] = ['ar']

export const isRTL = (lang: string): boolean => RTL_LANGUAGES.includes(lang as Language)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

const applyDir = (lng: string) => {
  const dir = isRTL(lng) ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
  document.documentElement.dir = dir
}

applyDir(i18n.language)
i18n.on('languageChanged', applyDir)

export default i18n
