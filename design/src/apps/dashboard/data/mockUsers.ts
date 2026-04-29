export type UserRole = 'admin' | 'agent' | 'supervisor' | 'fieldTeam'
export type UserStatus = 'active' | 'inactive' | 'pending'

export type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
  zone?: string
  status: UserStatus
  lastLogin?: string
}

export const MOCK_USERS: AppUser[] = [
  {
    id: 'u-01',
    name: 'Hicham Belkadi',
    email: 'h.belkadi@ouarzazate.ma',
    role: 'admin',
    zone: '—',
    status: 'active',
    lastLogin: '2026-04-29T09:14:00Z',
  },
  {
    id: 'u-02',
    name: 'Fatima Ouali',
    email: 'f.ouali@ouarzazate.ma',
    role: 'supervisor',
    zone: 'Zone Sud',
    status: 'active',
    lastLogin: '2026-04-29T08:45:00Z',
  },
  {
    id: 'u-03',
    name: 'Karim Lazrak',
    email: 'k.lazrak@ouarzazate.ma',
    role: 'agent',
    zone: 'Hay Al Wahda',
    status: 'active',
    lastLogin: '2026-04-29T07:55:00Z',
  },
  {
    id: 'u-04',
    name: 'Mounir Tazi',
    email: 'm.tazi@ouarzazate.ma',
    role: 'agent',
    zone: 'Sidi Daoud',
    status: 'active',
    lastLogin: '2026-04-28T17:32:00Z',
  },
  {
    id: 'u-05',
    name: 'Said El Idrissi',
    email: 's.elidrissi@ouarzazate.ma',
    role: 'fieldTeam',
    zone: 'Tabounte',
    status: 'active',
    lastLogin: '2026-04-29T08:10:00Z',
  },
  {
    id: 'u-06',
    name: 'Brahim Sefrioui',
    email: 'b.sefrioui@ouarzazate.ma',
    role: 'fieldTeam',
    zone: 'Sidi Daoud',
    status: 'active',
    lastLogin: '2026-04-29T07:48:00Z',
  },
  {
    id: 'u-07',
    name: 'Aicha Bennouna',
    email: 'a.bennouna@ouarzazate.ma',
    role: 'agent',
    zone: 'Tarmigt',
    status: 'pending',
  },
  {
    id: 'u-08',
    name: 'Khalid Bouazza',
    email: 'k.bouazza@ouarzazate.ma',
    role: 'fieldTeam',
    zone: 'Hay Annahda',
    status: 'inactive',
    lastLogin: '2026-04-15T16:22:00Z',
  },
]

export type AuditCategory = 'auth' | 'report' | 'team' | 'settings' | 'user'

export type AuditEntry = {
  id: string
  at: string
  user: { name: string; role: UserRole }
  action: string
  target?: string
  category: AuditCategory
  ip: string
  agent: string
  tone: 'normal' | 'success' | 'urgent' | 'muted'
}

export const MOCK_AUDIT: AuditEntry[] = [
  {
    id: 'a-001',
    at: '2026-04-29T09:42:00Z',
    user: { name: 'Système', role: 'admin' },
    action: 'Nouveau signalement reçu',
    target: 'OZN-2618-47',
    category: 'report',
    ip: '—',
    agent: 'API · webhook',
    tone: 'urgent',
  },
  {
    id: 'a-002',
    at: '2026-04-29T09:31:00Z',
    user: { name: 'Fatima Ouali', role: 'supervisor' },
    action: 'A validé et assigné',
    target: 'OZN-2618-43 → Équipe Sud 01',
    category: 'report',
    ip: '197.230.45.18',
    agent: 'Chrome · macOS',
    tone: 'normal',
  },
  {
    id: 'a-003',
    at: '2026-04-29T09:14:00Z',
    user: { name: 'Hicham Belkadi', role: 'admin' },
    action: 'Connexion à la plateforme',
    category: 'auth',
    ip: '197.230.45.18',
    agent: 'Chrome · macOS',
    tone: 'muted',
  },
  {
    id: 'a-004',
    at: '2026-04-29T08:54:00Z',
    user: { name: 'Mounir Tazi', role: 'agent' },
    action: 'A clôturé le signalement',
    target: 'OZN-2618-42 (capturé)',
    category: 'report',
    ip: '197.230.45.21',
    agent: 'PWA · Android',
    tone: 'success',
  },
  {
    id: 'a-005',
    at: '2026-04-29T08:33:00Z',
    user: { name: 'Hicham Belkadi', role: 'admin' },
    action: 'A rejeté le signalement (doublon)',
    target: 'OZN-2618-39',
    category: 'report',
    ip: '197.230.45.18',
    agent: 'Chrome · macOS',
    tone: 'muted',
  },
  {
    id: 'a-006',
    at: '2026-04-29T08:14:00Z',
    user: { name: 'Karim Lazrak', role: 'agent' },
    action: "A créé l'équipe",
    target: 'Équipe Nord 02',
    category: 'team',
    ip: '197.230.45.22',
    agent: 'Firefox · Windows',
    tone: 'normal',
  },
  {
    id: 'a-007',
    at: '2026-04-28T17:45:00Z',
    user: { name: 'Hicham Belkadi', role: 'admin' },
    action: 'A modifié le numéro vert',
    target: 'Paramètres → Numéro public',
    category: 'settings',
    ip: '197.230.45.18',
    agent: 'Chrome · macOS',
    tone: 'normal',
  },
  {
    id: 'a-008',
    at: '2026-04-28T16:22:00Z',
    user: { name: 'Khalid Bouazza', role: 'fieldTeam' },
    action: 'Connexion à la plateforme',
    category: 'auth',
    ip: '105.157.34.92',
    agent: 'PWA · Android',
    tone: 'muted',
  },
  {
    id: 'a-009',
    at: '2026-04-28T15:08:00Z',
    user: { name: 'Hicham Belkadi', role: 'admin' },
    action: 'A invité un nouvel utilisateur',
    target: 'a.bennouna@ouarzazate.ma',
    category: 'user',
    ip: '197.230.45.18',
    agent: 'Chrome · macOS',
    tone: 'normal',
  },
  {
    id: 'a-010',
    at: '2026-04-28T11:30:00Z',
    user: { name: 'Système', role: 'admin' },
    action: 'Tentative de connexion échouée',
    target: 'k.bouazza@ouarzazate.ma',
    category: 'auth',
    ip: '105.157.34.99',
    agent: 'Inconnu',
    tone: 'urgent',
  },
]
