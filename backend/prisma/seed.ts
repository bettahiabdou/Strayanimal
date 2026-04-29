/**
 * Local-dev seed: agents, teams, and a handful of reports across the
 * status lifecycle. Idempotent — safe to run repeatedly.
 *
 *   npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

const PASSWORD = 'azerty1234' // dev-only

async function main() {
  console.info('🌱 Seeding…')

  // ─── Users
  const passwordHash = await argon2.hash(PASSWORD)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ouarzazate.ma' },
    update: {},
    create: {
      email: 'admin@ouarzazate.ma',
      name: 'Hicham Belkadi',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  const supervisor = await prisma.user.upsert({
    where: { email: 'f.ouali@ouarzazate.ma' },
    update: {},
    create: {
      email: 'f.ouali@ouarzazate.ma',
      name: 'Fatima Ouali',
      passwordHash,
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      zone: 'Zone Sud',
    },
  })

  const agentLazrak = await prisma.user.upsert({
    where: { email: 'k.lazrak@ouarzazate.ma' },
    update: {},
    create: {
      email: 'k.lazrak@ouarzazate.ma',
      name: 'Karim Lazrak',
      passwordHash,
      role: 'AGENT',
      status: 'ACTIVE',
      zone: 'Hay Al Wahda',
    },
  })

  const agentTazi = await prisma.user.upsert({
    where: { email: 'm.tazi@ouarzazate.ma' },
    update: {},
    create: {
      email: 'm.tazi@ouarzazate.ma',
      name: 'Mounir Tazi',
      passwordHash,
      role: 'AGENT',
      status: 'ACTIVE',
      zone: 'Sidi Daoud',
    },
  })

  const fieldSaid = await prisma.user.upsert({
    where: { email: 's.elidrissi@ouarzazate.ma' },
    update: {},
    create: {
      email: 's.elidrissi@ouarzazate.ma',
      name: 'Said El Idrissi',
      passwordHash,
      role: 'FIELD_TEAM',
      status: 'ACTIVE',
      zone: 'Tabounte',
    },
  })

  const fieldBrahim = await prisma.user.upsert({
    where: { email: 'b.sefrioui@ouarzazate.ma' },
    update: {},
    create: {
      email: 'b.sefrioui@ouarzazate.ma',
      name: 'Brahim Sefrioui',
      passwordHash,
      role: 'FIELD_TEAM',
      status: 'ACTIVE',
      zone: 'Sidi Daoud',
    },
  })

  // ─── Teams
  const teamNord = await prisma.team.upsert({
    where: { name: 'Équipe Nord 01' },
    update: {},
    create: {
      name: 'Équipe Nord 01',
      zone: 'Hay Al Wahda · Tabounte',
    },
  })

  const teamSud = await prisma.team.upsert({
    where: { name: 'Équipe Sud 01' },
    update: {},
    create: {
      name: 'Équipe Sud 01',
      zone: 'Hay Al Massira · Centre',
    },
  })

  // ─── Team membership (lead + member each)
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: fieldSaid.id, teamId: teamNord.id } },
    update: {},
    create: { userId: fieldSaid.id, teamId: teamNord.id, isLead: true },
  })
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: fieldBrahim.id, teamId: teamSud.id } },
    update: {},
    create: { userId: fieldBrahim.id, teamId: teamSud.id, isLead: true },
  })

  // ─── Reports across the lifecycle
  const seedReports = [
    {
      publicRef: 'OZN-2618-47',
      source: 'WEB_FORM' as const,
      category: 'AGGRESSIVE' as const,
      animalType: 'DOG' as const,
      animalCount: 1,
      isUrgent: true,
      status: 'PENDING' as const,
      latitude: 30.9192,
      longitude: -6.8943,
      address: 'Rue Hassan II, près de la mosquée',
      zone: 'Hay Al Wahda',
      comment: 'Chien agressif qui aboie sur les passants.',
    },
    {
      publicRef: 'OZN-2618-46',
      source: 'WEB_FORM' as const,
      category: 'INJURED' as const,
      animalType: 'DOG' as const,
      animalCount: 1,
      isUrgent: true,
      status: 'PENDING' as const,
      latitude: 30.921,
      longitude: -6.8901,
      address: "Avenue Mohammed V, devant l'épicerie Anouar",
      zone: 'Tabounte',
      comment: 'Chiot blessé à la patte arrière.',
      citizenName: 'Karim B.',
      citizenPhone: '+212 6 12 34 56 78',
    },
    {
      publicRef: 'OZN-2618-44',
      source: 'WEB_FORM' as const,
      category: 'STRAY' as const,
      animalType: 'DOG' as const,
      animalCount: 1,
      isUrgent: false,
      status: 'IN_PROGRESS' as const,
      latitude: 30.91,
      longitude: -6.91,
      address: 'Rue des Écoles',
      zone: 'Tarmigt',
      comment: "Chien errant qui suit les enfants à la sortie de l'école.",
      triagedById: admin.id,
      assignedById: admin.id,
      teamId: teamNord.id,
    },
    {
      publicRef: 'OZN-2618-42',
      source: 'WEB_FORM' as const,
      category: 'AGGRESSIVE' as const,
      animalType: 'DOG' as const,
      animalCount: 4,
      isUrgent: true,
      status: 'RESOLVED' as const,
      latitude: 30.905,
      longitude: -6.88,
      address: 'Rue 12 Mars',
      zone: 'Tinzouline',
      comment: 'Meute agressive autour du marché.',
      triagedById: supervisor.id,
      assignedById: supervisor.id,
      teamId: teamNord.id,
    },
  ]

  for (const r of seedReports) {
    const { teamId, ...reportData } = r
    const report = await prisma.report.upsert({
      where: { publicRef: r.publicRef },
      update: {},
      create: {
        ...reportData,
        triagedAt: r.triagedById ? new Date() : null,
        assignedAt: r.assignedById ? new Date() : null,
        resolvedAt: r.status === 'RESOLVED' ? new Date() : null,
      },
    })
    if (teamId) {
      await prisma.mission.upsert({
        where: { reportId: report.id },
        update: {},
        create: {
          reportId: report.id,
          teamId,
          status:
            r.status === 'RESOLVED'
              ? 'CAPTURED'
              : r.status === 'IN_PROGRESS'
                ? 'EN_ROUTE'
                : 'ASSIGNED',
          enRouteAt: r.status !== 'PENDING' ? new Date() : null,
          closedAt: r.status === 'RESOLVED' ? new Date() : null,
          outcome: r.status === 'RESOLVED' ? 'CAPTURED' : null,
          durationMin: r.status === 'RESOLVED' ? 95 : null,
        },
      })
    }
  }

  // ─── Audit
  await prisma.auditEvent.create({
    data: {
      category: 'AUTH',
      action: 'seed.run',
      target: 'database',
      userId: admin.id,
    },
  })

  console.info('✅ Seed complete.')
  console.info('')
  console.info('Login credentials (dev):')
  console.info('  admin       admin@ouarzazate.ma          / azerty1234')
  console.info('  supervisor  f.ouali@ouarzazate.ma        / azerty1234')
  console.info('  agent       k.lazrak@ouarzazate.ma       / azerty1234')
  console.info('  agent       m.tazi@ouarzazate.ma         / azerty1234')
  console.info('  field team  s.elidrissi@ouarzazate.ma    / azerty1234')
  console.info('  field team  b.sefrioui@ouarzazate.ma     / azerty1234')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
