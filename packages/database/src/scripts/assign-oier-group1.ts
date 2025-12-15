import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  // Load seasons
  const seasons = await prisma.season.findMany({ orderBy: { startDate: 'asc' } });
  if (seasons.length === 0) {
    console.log('No hay temporadas en la BD');
    return;
  }
  // Determine active season (startDate <= now <= endDate) else last season
  let active = seasons.find(s => s.startDate <= now && s.endDate >= now) || seasons[seasons.length - 1];
  console.log('Temporada seleccionada:', active.name, active.startDate.toISOString(), active.endDate.toISOString());

  // Find Grupo 1 of active season
  const group1 = await prisma.group.findFirst({ where: { seasonId: active.id, name: 'Grupo 1' } });
  if (!group1) {
    console.log('No existe Grupo 1 en la temporada activa');
    return;
  }

  // Find Oier player
  const user = await prisma.user.findFirst({ where: { email: 'oier.quesada@freesquash.com' }, include: { player: true } });
  if (!user?.player) {
    console.log('Usuario Oier no encontrado o sin player');
    return;
  }

  // Ensure groupPlayers record exists
  const gp = await prisma.groupPlayer.findFirst({ where: { groupId: group1.id, playerId: user.player.id } });
  if (!gp) {
    // Create with default rankingPosition 0
    await prisma.groupPlayer.create({ data: { groupId: group1.id, playerId: user.player.id, rankingPosition: 0 } });
    console.log('Creado registro group_players para Oier en Grupo 1');
  } else {
    console.log('Oier ya tenía registro en group_players para Grupo 1');
  }

  // Update currentGroupId
  await prisma.player.update({ where: { id: user.player.id }, data: { currentGroupId: group1.id } });
  console.log(`Asignado currentGroupId=${group1.id} (${group1.name} / ${active.name}) a Oier`);
}

main().catch(e => { console.error(e); }).finally(() => prisma.$disconnect());
