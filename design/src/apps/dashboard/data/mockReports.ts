export type ReportCategory = 'aggressive' | 'injured' | 'stray'
export type ReportStatus =
  | 'pending'
  | 'approved'
  | 'assigned'
  | 'inProgress'
  | 'resolved'
  | 'rejected'
  | 'impossible'

export type Report = {
  id: string
  photoUrl: string
  category: ReportCategory
  status: ReportStatus
  zone: string
  address: string
  receivedAt: string
  reporter: {
    name?: string
    phone?: string
  }
  comment: string
  animalCount: number
  isUrgent: boolean
  agent?: string
  team?: string
  /** Geo of the report — used by the map screen. Optional for legacy mocks. */
  latitude?: number
  longitude?: number
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70`

export const MOCK_REPORTS: Report[] = [
  {
    id: 'OZN-2618-47',
    photoUrl: photo('1561037404-61cd46aa615b'),
    category: 'aggressive',
    status: 'pending',
    zone: 'Hay Al Wahda',
    address: 'Rue Hassan II, près de la mosquée',
    receivedAt: '2026-04-29T09:42:00Z',
    reporter: { name: 'Anonyme' },
    comment: 'Chien agressif qui aboie sur les passants. A déjà essayé de mordre un enfant.',
    animalCount: 1,
    isUrgent: true,
  },
  {
    id: 'OZN-2618-46',
    photoUrl: photo('1583511655857-d19b40a7a54e'),
    category: 'injured',
    status: 'pending',
    zone: 'Tabounte',
    address: "Avenue Mohammed V, devant l'épicerie Anouar",
    receivedAt: '2026-04-29T09:18:00Z',
    reporter: { name: 'Karim B.', phone: '+212 6 12 34 56 78' },
    comment: 'Chiot blessé à la patte arrière, ne se déplace presque pas.',
    animalCount: 1,
    isUrgent: true,
  },
  {
    id: 'OZN-2618-45',
    photoUrl: photo('1450778869180-41d0601e046e'),
    category: 'stray',
    status: 'pending',
    zone: 'Sidi Daoud',
    address: 'Place de la Gare',
    receivedAt: '2026-04-29T08:55:00Z',
    reporter: {},
    comment: 'Trois chiens errants autour des poubelles depuis plusieurs jours.',
    animalCount: 3,
    isUrgent: false,
  },
  {
    id: 'OZN-2618-44',
    photoUrl: photo('1517423440428-a5a00ad493e8'),
    category: 'stray',
    status: 'inProgress',
    zone: 'Tarmigt',
    address: 'Rue des Écoles',
    receivedAt: '2026-04-29T08:10:00Z',
    reporter: { name: 'Fatima E.' },
    comment: 'Chien errant qui suit les enfants à la sortie de l’école.',
    animalCount: 1,
    isUrgent: false,
    agent: 'M. Belkadi',
    team: 'Équipe Nord 02',
  },
  {
    id: 'OZN-2618-43',
    photoUrl: photo('1583337130417-3346a1be7dee'),
    category: 'injured',
    status: 'assigned',
    zone: 'Hay Al Massira',
    address: 'Boulevard Tarik Ibn Ziad',
    receivedAt: '2026-04-29T07:32:00Z',
    reporter: {},
    comment: 'Chat blessé caché sous une voiture.',
    animalCount: 1,
    isUrgent: true,
    agent: 'Mme Ouali',
    team: 'Équipe Sud 01',
  },
  {
    id: 'OZN-2618-42',
    photoUrl: photo('1561037404-61cd46aa615b'),
    category: 'aggressive',
    status: 'resolved',
    zone: 'Tinzouline',
    address: 'Rue 12 Mars',
    receivedAt: '2026-04-29T07:05:00Z',
    reporter: { name: 'Anonyme' },
    comment: 'Meute agressive autour du marché.',
    animalCount: 4,
    isUrgent: true,
    agent: 'M. Belkadi',
    team: 'Équipe Nord 01',
  },
  {
    id: 'OZN-2618-41',
    photoUrl: photo('1517423440428-a5a00ad493e8'),
    category: 'stray',
    status: 'resolved',
    zone: 'Hay Annahda',
    address: 'Rue 7',
    receivedAt: '2026-04-29T06:48:00Z',
    reporter: {},
    comment: 'Chien seul, calme, ne semble pas dangereux.',
    animalCount: 1,
    isUrgent: false,
    agent: 'Mme Ouali',
    team: 'Équipe Sud 02',
  },
  {
    id: 'OZN-2618-40',
    photoUrl: photo('1583511655857-d19b40a7a54e'),
    category: 'injured',
    status: 'resolved',
    zone: 'Hay Salam',
    address: 'Avenue des FAR',
    receivedAt: '2026-04-29T06:15:00Z',
    reporter: { name: 'Youssef R.' },
    comment: 'Chien renversé par une voiture, encore vivant.',
    animalCount: 1,
    isUrgent: true,
    agent: 'M. Belkadi',
    team: 'Équipe Sud 01',
  },
]

export const KPI_VALUES = {
  pendingTriage: 7,
  inProgress: 12,
  resolvedToday: 23,
  avgResponse: '2h 15',
}

export const HOT_ZONES = [
  { name: 'Hay Al Wahda', count: 14, trend: '+3' },
  { name: 'Sidi Daoud', count: 11, trend: '+2' },
  { name: 'Tabounte', count: 9, trend: '0' },
  { name: 'Tarmigt', count: 7, trend: '+1' },
  { name: 'Hay Al Massira', count: 6, trend: '-1' },
]

export const ACTIVITY_FEED = [
  {
    time: '09:42',
    who: 'Citoyen',
    what: 'a soumis un nouveau signalement à Hay Al Wahda (urgent)',
    tone: 'urgent' as const,
  },
  {
    time: '09:31',
    who: 'Mme Ouali',
    what: 'a validé le signalement OZN-2618-43 et l’a assigné à Équipe Sud 01',
    tone: 'normal' as const,
  },
  {
    time: '09:12',
    who: 'Équipe Nord 02',
    what: 'a marqué OZN-2618-44 comme « en cours »',
    tone: 'normal' as const,
  },
  {
    time: '08:54',
    who: 'Équipe Sud 01',
    what: 'a clôturé OZN-2618-42 — capture réussie',
    tone: 'success' as const,
  },
  {
    time: '08:33',
    who: 'M. Belkadi',
    what: 'a rejeté un signalement (doublon de OZN-2618-39)',
    tone: 'muted' as const,
  },
]
