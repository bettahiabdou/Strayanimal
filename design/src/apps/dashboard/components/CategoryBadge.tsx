import { useTranslation } from 'react-i18next'
import { type ReportCategory } from '../data/mockReports'
import { cn } from '@/design-system/cn'

const TONE: Record<ReportCategory, string> = {
  aggressive: 'bg-red-100 text-red-700 border-red-200',
  injured: 'bg-orange-100 text-orange-700 border-orange-200',
  stray: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export function CategoryBadge({ category }: { category: ReportCategory }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5 whitespace-nowrap',
        TONE[category],
      )}
    >
      {t(`dashboard.category.${category}`)}
    </span>
  )
}
