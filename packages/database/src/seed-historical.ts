import { PrismaClient, MovementType, Season } from '@prisma/client';

interface SeasonWithGroups extends Season {
  previousSeasonId?: string | null;
  groups: Array<{
    id: string;
    name: string;
    groupPlayers: Array<{
      playerId: string;
      rankingPosition: number;
      player: { id: string; name: string; nickname: string | null };
    }>;
  }>;
}

const prisma = new PrismaClient();

async function main() {
  console.log('== Seed histórico ficticio ==');
  // Obtener temporada "actual" (la más reciente por startDate)
  const currentSeason = await prisma.season.findFirst({
    orderBy: { startDate: 'desc' },
    include: { groups: { include: { groupPlayers: { include: { player: true } } } } }
  }) as SeasonWithGroups | null;
  if (!currentSeason) {
    console.log('No hay temporadas, abortando');
    return;
  }
  if (currentSeason.previousSeasonId) {
    console.log('La temporada actual ya tiene previousSeasonId, se continuará pero podría duplicar histórico.');
  }

  // Calcular duración y fechas previas
  const monthDiff = (currentSeason.endDate.getMonth() - currentSeason.startDate.getMonth() + 12 * (currentSeason.endDate.getFullYear() - currentSeason.startDate.getFullYear())) + 1;
  const prevStart = new Date(currentSeason.startDate);
  prevStart.setMonth(prevStart.getMonth() - monthDiff);
  const prevEnd = new Date(currentSeason.endDate);
  prevEnd.setMonth(prevEnd.getMonth() - monthDiff);

  const startYear = prevStart.getFullYear();
  const endYear = prevEnd.getFullYear();
  const prevName = startYear !== endYear ? `${startYear}-${endYear}` : `${startYear} (${monthDiff}m)`;

  console.log('Creando temporada previa:', prevName);
  const previousSeason = await prisma.season.create({ data: { name: prevName, startDate: prevStart, endDate: prevEnd } });

  // Crear grupos previos clonando nombres
  const groupMap: Record<string, string> = {}; // currentGroupId -> previousGroupId
  for (const g of currentSeason.groups) {
    const pg = await prisma.group.create({ data: { name: g.name, seasonId: previousSeason.id } });
    groupMap[g.id] = pg.id;
  }

  // Asignar jugadores a grupos previos con mismas posiciones simuladas
  for (const g of currentSeason.groups) {
    // Ordenar jugadores actuales por ranking si existe, si no por nombre
    const players = [...g.groupPlayers].sort((a, b) => a.rankingPosition - b.rankingPosition || a.player.name.localeCompare(b.player.name));
    let pos = 1;
    for (const gp of players) {
      await prisma.groupPlayer.create({ data: { groupId: groupMap[g.id], playerId: gp.playerId, rankingPosition: pos } });
      pos++;
    }
  }

  // Simular movimientos (promociones / descensos) entre grupos adyacentes
  const sortedGroups = [...currentSeason.groups].sort((a, b) => a.name.localeCompare(b.name));
  const promoRecords: any[] = [];
  for (let i = 0; i < sortedGroups.length; i++) {
    const g = sortedGroups[i];
    const prevGroupId = groupMap[g.id];
    const players = await prisma.groupPlayer.findMany({ where: { groupId: prevGroupId }, orderBy: { rankingPosition: 'asc' } });
    // Top 2 pueden haber sido promocionados (si existe grupo superior)
    if (i > 0) {
      const superiorPrevGroupId = groupMap[sortedGroups[i - 1].id];
      for (const p of players.slice(0, 2)) {
        promoRecords.push({ playerId: p.playerId, fromGroupId: prevGroupId, toGroupId: superiorPrevGroupId, movementType: MovementType.PROMOTION });
      }
    }
    // Bottom 2 pueden haber sido relegados (si existe grupo inferior)
    if (i < sortedGroups.length - 1) {
      const inferiorPrevGroupId = groupMap[sortedGroups[i + 1].id];
      for (const p of players.slice(-2)) {
        promoRecords.push({ playerId: p.playerId, fromGroupId: prevGroupId, toGroupId: inferiorPrevGroupId, movementType: MovementType.RELEGATION });
      }
    }
  }

  const movementDate = new Date(previousSeason.endDate);
  movementDate.setDate(movementDate.getDate() - 1);

  for (const rec of promoRecords) {
    await prisma.promotionRecord.create({ data: { ...rec, date: movementDate } });
  }
  console.log('Promociones/relegaciones simuladas:', promoRecords.length);

  // Insertar historial de grupo por jugador
  for (const g of currentSeason.groups) {
    const prevGroupId = groupMap[g.id];
    const players = await prisma.groupPlayer.findMany({ where: { groupId: prevGroupId }, orderBy: { rankingPosition: 'asc' } });
    let rank = 1;
    for (const p of players) {
      // Buscar si tuvo movimiento
      const mov = promoRecords.find(m => m.playerId === p.playerId && (m.fromGroupId === prevGroupId || m.toGroupId === prevGroupId));
      await prisma.playerGroupHistory.create({
        data: {
          playerId: p.playerId,
          seasonId: previousSeason.id,
          groupId: prevGroupId,
          finalRank: rank,
          movementType: mov ? mov.movementType : MovementType.STAY,
        }
      });
      rank++;
    }
  }
  console.log('Historial jugadores creado.');

  // Crear algunos partidos aleatorios en cada grupo de la temporada previa
  for (const g of currentSeason.groups) {
    const prevGroupId = groupMap[g.id];
    const players = await prisma.groupPlayer.findMany({ where: { groupId: prevGroupId }, orderBy: { rankingPosition: 'asc' } });
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i].playerId;
        const p2 = players[j].playerId;
        // Generar sets aleatorios 3 al mejor de 5 (0-3 cada uno)
        let gamesP1 = Math.floor(Math.random() * 4); // 0..3
        let gamesP2 = Math.floor(Math.random() * 4);
        if (gamesP1 === gamesP2) {
          // asegurar que no empate en sets (ajustar uno)
          if (gamesP1 < 3) {
            gamesP1++;
          } else {
            gamesP2--;
          }
        }
        const winnerId = gamesP1 > gamesP2 ? p1 : p2;
        const matchDate = new Date(previousSeason.startDate.getTime() + Math.random() * (previousSeason.endDate.getTime() - previousSeason.startDate.getTime()));
        await prisma.match.create({
          data: { groupId: prevGroupId, player1Id: p1, player2Id: p2, gamesP1, gamesP2, winnerId, date: matchDate }
        });
      }
    }
  }
  console.log('Partidos aleatorios creados.');

  // Enlazar temporada previa con la actual
  // Prisma client aún no reconoce previousSeasonId en tipos (fallback)
  await (prisma as any).season.update({ where: { id: currentSeason.id }, data: { previousSeasonId: previousSeason.id } });
  console.log('Temporada actual enlazada con temporada previa.');

  console.log('Seed histórico ficticio COMPLETADO');
}

main().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
