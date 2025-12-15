import { prisma } from '@freesquash/database';

async function generateRandomMatches() {
  try {
    // Borrar todos los partidos existentes
    const deletedCount = await prisma.match.deleteMany({});
    console.log(`✓ Eliminados ${deletedCount.count} partidos existentes\n`);

    // Obtener temporada actual con grupos y jugadores
    const season = await prisma.season.findFirst({
      include: {
        groups: {
          include: {
            groupPlayers: {
              include: { player: true }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!season) {
      console.log('No se encontró temporada');
      return;
    }

    console.log(`Temporada: ${season.name}`);
    console.log(`Grupos disponibles: ${season.groups.length}\n`);

    // Generar partidos aleatorios solo en algunos grupos (3 de 8)
    const groupsToPopulate = [0, 2, 4]; // Grupo 1, 3, 5
    let totalMatches = 0;

    for (const groupIndex of groupsToPopulate) {
      const group = season.groups[groupIndex];
      if (!group) continue;

      const players = group.groupPlayers.map(gp => gp.player);
      if (players.length < 2) {
        console.log(`⚠ ${group.name} tiene menos de 2 jugadores, saltando`);
        continue;
      }

      console.log(`\n📊 ${group.name} - ${players.length} jugadores`);
      
      // Generar algunos partidos aleatorios (no todos los posibles)
      const matchCount = Math.min(Math.floor(players.length * 1.5), 15);
      const matches = [];

      for (let i = 0; i < matchCount; i++) {
        // Seleccionar 2 jugadores aleatorios diferentes
        const p1Index = Math.floor(Math.random() * players.length);
        let p2Index = Math.floor(Math.random() * players.length);
        while (p2Index === p1Index) {
          p2Index = Math.floor(Math.random() * players.length);
        }

        const player1 = players[p1Index];
        const player2 = players[p2Index];

        // Generar resultado aleatorio (0-3 games por jugador, ganador tiene 3)
        const p1Games = Math.random() > 0.5 ? 3 : Math.floor(Math.random() * 3);
        const p2Games = p1Games === 3 ? Math.floor(Math.random() * 3) : 3;
        const winnerId = p1Games === 3 ? player1.id : player2.id;

        // Fecha aleatoria en el último mes
        const daysAgo = Math.floor(Math.random() * 30);
        const matchDate = new Date();
        matchDate.setDate(matchDate.getDate() - daysAgo);

        matches.push({
          groupId: group.id,
          player1Id: player1.id,
          player2Id: player2.id,
          gamesP1: p1Games,
          gamesP2: p2Games,
          winnerId,
          matchStatus: 'PLAYED',
          date: matchDate
        });
      }

      // Crear partidos en lote
      await prisma.match.createMany({ data: matches });
      totalMatches += matches.length;
      
      console.log(`  ✓ Creados ${matches.length} partidos`);
      console.log(`  Jugadores: ${players.map(p => p.name).join(', ')}`);
    }

    console.log(`\n✅ Total: ${totalMatches} partidos creados en ${groupsToPopulate.length} grupos`);
    console.log(`\nGrupos CON partidos: ${groupsToPopulate.map(i => season.groups[i].name).join(', ')}`);
    console.log(`Grupos SIN partidos: ${season.groups.filter((_, i) => !groupsToPopulate.includes(i)).map(g => g.name).join(', ')}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateRandomMatches();
