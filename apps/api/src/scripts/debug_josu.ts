import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
  console.log('Season activa:', activeSeason?.name);
  
  const users = await prisma.user.findMany({
    where: { email: { contains: 'josu' } },
    include: { player: { include: { groupPlayers: { include: { group: true } } } } }
  });
  
  console.log('\nJugadores con josu:');
  users.forEach(u => {
    console.log('Email:', u.email, '| Player:', u.player?.name);
    console.log('Grupos:', u.player?.groupPlayers.map(gp => gp.group.name).join(', ') || 'NINGUNO');
  });
}

check().finally(() => prisma.$disconnect());
