import { prisma } from '../lib/db.js'

/**
 * Active teams, shaped for the dashboard's assign dropdown.
 * Includes a member count so a supervisor can pick the right one.
 */
export async function listActiveTeams() {
  const teams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: [{ zone: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      zone: true,
      isActive: true,
      _count: { select: { members: true } },
    },
  })
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    zone: t.zone,
    isActive: t.isActive,
    memberCount: t._count.members,
  }))
}
