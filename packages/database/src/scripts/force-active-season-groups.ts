import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const seasons = await prisma.season.findMany();
  if (seasons.length === 0) { console.log('No hay temporadas.'); return; }
  const active = seasons.find(s => s.startDate <= now && s.endDate >= now) || seasons.sort((a,b)=>a.startDate.getTime()-b.startDate.getTime())[seasons.length-1];
  console.log('Temporada activa usada:', active.name, active.startDate.toISOString(), active.endDate.toISOString());

  // All players with a group in active season
  const groupPlayersActive = await prisma.groupPlayer.findMany({
    where: { group: { seasonId: active.id } },
    include: { player: true, group: true }
  });

  const byPlayer: Record<string, { groupId: string; groupName: string }> = {};
  for (const gp of groupPlayersActive) {
    // One group per season per player expected; take first
    if (!byPlayer[gp.playerId]) {
      byPlayer[gp.playerId] = { groupId: gp.groupId, groupName: gp.group.name };
    }
  }

  let updated = 0, already = 0;
  for (const playerId of Object.keys(byPlayer)) {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) continue;
    const desired = byPlayer[playerId].groupId;
    if (player.currentGroupId === desired) {
      already++;
      continue;
    }
    await prisma.player.update({ where: { id: playerId }, data: { currentGroupId: desired } });
    updated++;
    console.log(`Player ${playerId} -> currentGroupId=${desired} (${byPlayer[playerId].groupName})`);
  }

  console.log(`Resumen: ${updated} actualizados, ${already} ya correctos, total con grupo activo: ${Object.keys(byPlayer).length}`);
}

main().catch(e => console.error(e)).finally(()=>prisma.$disconnect());
