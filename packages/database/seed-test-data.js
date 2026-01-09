const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Creando datos de prueba en Railway...');

    // Limpiar datos existentes
    console.log('Limpiando datos existentes...');
    await prisma.match.deleteMany({});
    await prisma.groupPlayer.deleteMany({});
    await prisma.playerGroupHistory.deleteMany({});
    await prisma.playerSeasonStats.deleteMany({});
    await prisma.promotionRecord.deleteMany({});
    await prisma.seasonClosureEntry.deleteMany({});
    await prisma.seasonClosure.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Datos limpios');

    // Crear season
    const season = await prisma.season.create({
      data: {
        name: 'Temporada 2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
    });
    console.log('✅ Season creada:', season.name);

    // Crear grupos
    const groups = [];
    for (let i = 1; i <= 3; i++) {
      const group = await prisma.group.create({
        data: {
          name: `Grupo ${i}`,
          seasonId: season.id,
        },
      });
      groups.push(group);
    }
    console.log(`✅ ${groups.length} grupos creados`);

    // Crear usuarios y jugadores
    const users = [];
    const hashed = await bcrypt.hash('test123', 10);

    for (let i = 1; i <= 8; i++) {
      const user = await prisma.user.create({
        data: {
          email: `player${i}@test.com`,
          password: hashed,
          role: i === 1 ? 'ADMIN' : 'PLAYER',
          isActive: true,
        },
      });

      const player = await prisma.player.create({
        data: {
          userId: user.id,
          name: `Jugador ${i}`,
          nickname: `Player${i}`,
          calendarEnabled: false,
        },
      });

      // Agregar a un grupo
      const groupIndex = (i - 1) % 3;
      await prisma.groupPlayer.create({
        data: {
          groupId: groups[groupIndex].id,
          playerId: player.id,
        },
      });

      users.push({ user, player });
    }

    console.log(`✅ ${users.length} usuarios y jugadores creados`);

    console.log('\n🎉 DATOS DE PRUEBA CREADOS:');
    console.log('Admin: player1@test.com / test123');
    users.forEach((u, i) => {
      console.log(`Player${i + 1}: player${i + 1}@test.com / test123`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
