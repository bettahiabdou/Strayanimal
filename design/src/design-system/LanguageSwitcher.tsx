import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n'
import { cn } from './cn'

const labels: Record<Language, string> = {
  fr: 'Français',
  ar: 'العربية',
}

type Props = {
  className?: string
  tone?: 'light' | 'dark'
}

export function LanguageSwitcher({ className, tone = 'light' }: Props) {
  const { i18n } = useTranslation()
  const current = i18n.language as Language
  const isDark = tone === 'dark'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        isDark ? 'text-white' : 'text-gray-700',
        className,
      )}
    >
      {SUPPORTED_LANGUAGES.map((lng: Language, i) => (
        <span key={lng} className="flex items-center">
          <button
            onClick={() => i18n.changeLanguage(lng)}
            className={cn(
              'px-1.5 py-0.5 transition-colors',
              current === lng
                ? isDark
                  ? 'text-white font-bold underline underline-offset-4 decoration-2 decoration-white/70'
                  : 'text-gray-900 font-bold underline underline-offset-4 decoration-2 decoration-gray-900/70'
                : isDark
                  ? 'text-white/60 hover:text-white font-medium'
                  : 'text-gray-500 hover:text-gray-800 font-medium',
            )}
          >
            {labels[lng]}
          </button>
          {i < SUPPORTED_LANGUAGES.length - 1 && (
            <span className={isDark ? 'text-white/30' : 'text-gray-300'}>·</span>
          )}
        </span>
      ))}
    </div>
  )
}
