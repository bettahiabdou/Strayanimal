export type MissionStatus =
  | 'assigned'
  | 'enRoute'
  | 'onSite'
  | 'captured'
  | 'impossible'
  | 'completed'

export type MissionCategory = 'aggressive' | 'injured' | 'stray'

export type Mission = {
  id: string
  status: MissionStatus
  category: MissionCategory
  isUrgent: boolean
  address: string
  zone: string
  distanceKm: number
  etaMin: number
  receivedAt: string
  agentName: string
  agentNote?: string
  citizenComment: string
  animalCount: number
  photoUrl: string
  finishedAt?: string
  outcome?: 'captured' | 'impossible'
  durationMin?: number
  /** The parent report's public-ref (OZN-…) — used by deep-links. Optional for legacy mocks. */
  publicRef?: string
  /** Geo of the report — used to deep-link into maps. Optional for legacy mocks. */
  latitude?: number
  longitude?: number
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70`

export const CURRENT_AGENT = {
  name: 'Mounir Tazi',
  role: 'leadAgent' as const,
  team: 'Équipe Sud 01',
  zone: 'Hay Al Massira · Centre',
}

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'OZN-2618-43',
    status: 'enRoute',
    category: 'injured',
    isUrgent: true,
    address: 'Boulevard Tarik Ibn Ziad',
    zone: 'Hay Al Massira',
    distanceKm: 2.3,
    etaMin: 9,
    receivedAt: '2026-04-29T07:32:00Z',
    agentName: 'Mme Ouali',
    agentNote:
      'Le citoyen a indiqué que le chat est caché sous une voiture grise. Approche prudente.',
    citizenComment: 'Chat blessé caché sous une voiture, ne se déplace pas.',
    animalCount: 1,
    photoUrl: photo('1583337130417-3346a1be7dee'),
  },
  {
    id: 'OZN-2618-48',
    status: 'assigned',
    category: 'aggressive',
    isUrgent: true,
    address: 'Rue 12 Mars, marché central',
    zone: 'Centre',
    distanceKm: 1.1,
    etaMin: 5,
    receivedAt: '2026-04-29T09:48:00Z',
    agentName: 'Mme Ouali',
    agentNote: "Plusieurs riverains ont appelé. Présence d'enfants à proximité, urgence absolue.",
    citizenComment: 'Meute de 3 chiens agressifs, ils tournent autour des stands du marché.',
    animalCount: 3,
    photoUrl: photo('1561037404-61cd46aa615b'),
  },
  {
    id: 'OZN-2618-50',
    status: 'assigned',
    category: 'stray',
    isUrgent: false,
    address: 'Rue des Écoles, école Al Massira',
    zone: 'Hay Al Massira',
    distanceKm: 3.8,
    etaMin: 14,
    receivedAt: '2026-04-29T09:55:00Z',
    agentName: 'M. Belkadi',
    citizenComment:
      "Chien errant qui suit les enfants à la sortie de l'école. Pas agressif mais inquiétant.",
    animalCount: 1,
    photoUrl: photo('1450778869180-41d0601e046e'),
  },
]

export const COMPLETED_MISSIONS: Mission[] = [
  {
    id: 'OZN-2618-42',
    status: 'completed',
    category: 'aggressive',
    isUrgent: true,
    address: 'Avenue Mohammed V',
    zone: 'Centre',
    distanceKm: 0.8,
    etaMin: 4,
    receivedAt: '2026-04-29T07:05:00Z',
    finishedAt: '2026-04-29T08:45:00Z',
    outcome: 'captured',
    durationMin: 100,
    agentName: 'M. Belkadi',
    citizenComment: 'Meute agressive autour du marché.',
    animalCount: 4,
    photoUrl: photo('1561037404-61cd46aa615b'),
  },
  {
    id: 'OZN-2618-40',
    status: 'completed',
    category: 'injured',
    isUrgent: true,
    address: 'Avenue des FAR',
    zone: 'Hay Salam',
    distanceKm: 4.2,
    etaMin: 16,
    receivedAt: '2026-04-29T06:15:00Z',
    finishedAt: '2026-04-29T07:50:00Z',
    outcome: 'captured',
    durationMin: 95,
    agentName: 'M. Belkadi',
    citizenComment: 'Chien renversé par une voiture, encore vivant.',
    animalCount: 1,
    photoUrl: photo('1583511655857-d19b40a7a54e'),
  },
  {
    id: 'OZN-2618-38',
    status: 'completed',
    category: 'stray',
    isUrgent: false,
    address: 'Place de la Gare',
    zone: 'Sidi Daoud',
    distanceKm: 2.1,
    etaMin: 8,
    receivedAt: '2026-04-29T05:42:00Z',
    finishedAt: '2026-04-29T07:25:00Z',
    outcome: 'impossible',
    durationMin: 103,
    agentName: 'Mme Ouali',
    citizenComment: 'Trois chiens errants autour des poubelles.',
    animalCount: 3,
    photoUrl: photo('1517423440428-a5a00ad493e8'),
  },
]
