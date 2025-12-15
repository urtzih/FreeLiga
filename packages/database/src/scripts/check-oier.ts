import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'oier' } },
    include: { player: true }
  });
  console.log('User:', user);
  if (user?.player) {
    const gp = await prisma.groupPlayer.findMany({
      where: { playerId: user.player.id },
      include: { group: { include: { season: true } } }
    });
    console.log('GroupPlayers:', gp.map(g => ({ group: g.group.name, season: g.group.season.name, groupId: g.groupId })));
    const player = await prisma.player.findUnique({ where: { id: user.player.id } });
    console.log('currentGroupId:', player?.currentGroupId);
  }
}

main().finally(() => prisma.$disconnect());
