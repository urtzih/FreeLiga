import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany({
    where: { currentGroupId: null },
    include: {
      groupPlayers: {
        include: { group: { include: { season: true } } }
      }
    }
  });

  console.log(`Jugadores con currentGroupId nulo: ${players.length}`);

  for (const p of players) {
    if (p.groupPlayers.length === 0) {
      console.log(`- ${p.name}: sin grupos asociados, se omite.`);
      continue;
    }
    // Elegir el grupo de la temporada más reciente (por startDate)
    const sorted = [...p.groupPlayers].sort((a, b) => {
      const aDate = new Date(a.group.season.startDate).getTime();
      const bDate = new Date(b.group.season.startDate).getTime();
      return bDate - aDate;
    });
    const target = sorted[0];
    await prisma.player.update({
      where: { id: p.id },
      data: { currentGroupId: target.groupId }
    });
    console.log(`- ${p.name}: asignado currentGroupId=${target.groupId} (${target.group.name} / ${target.group.season.name})`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
