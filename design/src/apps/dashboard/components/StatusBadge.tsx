import { useTranslation } from 'react-i18next'
import { type ReportStatus } from '../data/mockReports'
import { cn } from '@/design-system/cn'

const TONE: Record<ReportStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  inProgress: 'bg-violet-100 text-violet-800 border-violet-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-gray-100 text-gray-700 border-gray-200',
  impossible: 'bg-rose-100 text-rose-800 border-rose-200',
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide rounded border px-1.5 py-0.5 whitespace-nowrap',
        TONE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {t(`dashboard.status.${status}`)}
    </span>
  )
}
