/* Mock daily volume for the last 30 days (oldest first) */
export const VOLUME_30D = [
  14, 17, 12, 19, 22, 18, 21, 24, 19, 23, 28, 26, 22, 25, 27, 30, 24, 21, 23, 28, 32, 29, 26, 31,
  35, 28, 27, 30, 33, 36,
]

/* Median response time in minutes per day, last 30 days */
export const RESPONSE_30D = [
  155, 148, 142, 138, 145, 130, 128, 132, 125, 121, 118, 122, 115, 119, 124, 117, 113, 110, 108,
  112, 115, 109, 105, 102, 108, 104, 99, 95, 97, 92,
]

export const CATEGORY_STATS = [
  { category: 'aggressive' as const, count: 187, color: 'bg-red-600' },
  { category: 'injured' as const, count: 243, color: 'bg-orange-500' },
  { category: 'stray' as const, count: 318, color: 'bg-yellow-500' },
]

export const ZONE_STATS = [
  { name: 'Hay Al Wahda', count: 142 },
  { name: 'Sidi Daoud', count: 118 },
  { name: 'Tabounte', count: 96 },
  { name: 'Hay Al Massira', count: 84 },
  { name: 'Tarmigt', count: 71 },
  { name: 'Tinzouline', count: 58 },
  { name: 'Hay Annahda', count: 47 },
  { name: 'Hay Salam', count: 32 },
]

export const TEAM_STATS = [
  { team: 'Équipe Nord 01', missions: 184, resolved: 171, avgResponse: '1h 48' },
  { team: 'Équipe Sud 01', missions: 162, resolved: 148, avgResponse: '2h 22' },
  { team: 'Équipe Sud 02', missions: 138, resolved: 132, avgResponse: '2h 10' },
  { team: 'Équipe Nord 02', missions: 124, resolved: 109, avgResponse: '2h 04' },
  { team: 'Équipe Centre 01', missions: 64, resolved: 58, avgResponse: '2h 35' },
]

export const KPI = {
  totalReports: 748,
  totalDelta: 12, // %
  resolutionRate: 89.4, // %
  resolutionDelta: 2.1,
  avgResponse: '1h 58',
  avgResponseDelta: -8, // % (negative is improvement)
  rejected: 41,
  rejectedDelta: -4,
  peakDay: { date: '2026-04-26', count: 36 },
}
