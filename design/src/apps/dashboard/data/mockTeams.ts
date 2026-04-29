export type TeamStatus = 'available' | 'enRoute' | 'onSite' | 'off'

export type Member = {
  name: string
  role: 'lead' | 'member'
}

export type FieldTeam = {
  id: string
  name: string
  status: TeamStatus
  zone: string
  members: Member[]
  todayMissions: number
  todayResolved: number
  weekMissions: number
  avgResponse: string
  currentMission?: {
    reportId: string
    address: string
    startedAt: string
  }
}

export const MOCK_TEAMS: FieldTeam[] = [
  {
    id: 'tn-01',
    name: 'Équipe Nord 01',
    status: 'available',
    zone: 'Hay Al Wahda · Tabounte',
    members: [
      { name: 'Hicham Belkadi', role: 'lead' },
      { name: 'Mohamed Akil', role: 'member' },
      { name: 'Said El Idrissi', role: 'member' },
    ],
    todayMissions: 8,
    todayResolved: 7,
    weekMissions: 41,
    avgResponse: '1h 48',
  },
  {
    id: 'tn-02',
    name: 'Équipe Nord 02',
    status: 'enRoute',
    zone: 'Sidi Daoud',
    members: [
      { name: 'Karim Lazrak', role: 'lead' },
      { name: 'Brahim Sefrioui', role: 'member' },
    ],
    todayMissions: 6,
    todayResolved: 4,
    weekMissions: 33,
    avgResponse: '2h 04',
    currentMission: {
      reportId: 'OZN-2618-44',
      address: 'Rue des Écoles, Tarmigt',
      startedAt: '2026-04-29T08:14:00Z',
    },
  },
  {
    id: 'ts-01',
    name: 'Équipe Sud 01',
    status: 'onSite',
    zone: 'Hay Al Massira · Centre',
    members: [
      { name: 'Mounir Tazi', role: 'lead' },
      { name: 'Abdellah Ouahbi', role: 'member' },
      { name: 'Yassine Bensalah', role: 'member' },
    ],
    todayMissions: 7,
    todayResolved: 5,
    weekMissions: 36,
    avgResponse: '2h 22',
    currentMission: {
      reportId: 'OZN-2618-43',
      address: 'Boulevard Tarik Ibn Ziad',
      startedAt: '2026-04-29T07:55:00Z',
    },
  },
  {
    id: 'ts-02',
    name: 'Équipe Sud 02',
    status: 'available',
    zone: 'Hay Salam · Tinzouline',
    members: [
      { name: 'Fatima Ouali', role: 'lead' },
      { name: 'Driss Amrani', role: 'member' },
    ],
    todayMissions: 5,
    todayResolved: 5,
    weekMissions: 28,
    avgResponse: '2h 10',
  },
  {
    id: 'tc-01',
    name: 'Équipe Centre 01',
    status: 'off',
    zone: 'Hay Annahda',
    members: [
      { name: 'Khalid Bouazza', role: 'lead' },
      { name: 'Othmane Riahi', role: 'member' },
    ],
    todayMissions: 0,
    todayResolved: 0,
    weekMissions: 14,
    avgResponse: '2h 35',
  },
]
