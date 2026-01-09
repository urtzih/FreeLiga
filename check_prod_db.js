const { PrismaClient } = require('@prisma/client');

// Usar la URL de producción
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:HkwOvwLFXIpySTWoZEVaXPZhQZgPSDbo@metro.proxy.rlwy.net:26282/railway'
    }
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Verificando grupo en producción...\n');
    
    // Verificar si el grupo existe
    const group = await prisma.group.findUnique({
      where: { id: 'cmk305pal008k3a0ulr9ocg1e' },
      include: { season: true }
    });
    
    console.log('Grupo:', group ? '✅ EXISTE' : '❌ NO EXISTE');
    if (group) {
      console.log('  - ID:', group.id);
      console.log('  - Nombre:', group.name);
      console.log('  - Temporada:', group.season?.name);
    }
    
    console.log('\n📊 Jugadores en ese grupo:');
    const groupPlayers = await prisma.groupPlayer.findMany({
      where: { groupId: 'cmk305pal008k3a0ulr9ocg1e' },
      include: { player: { include: { user: true } } }
    });
    
    if (groupPlayers.length === 0) {
      console.log('  ❌ NO HAY JUGADORES EN ESTE GRUPO');
    } else {
      groupPlayers.forEach(gp => {
        console.log(`  - ${gp.player.name} (${gp.player.user.email})`);
      });
    }
    
    console.log('\n🔍 Verificando usuario urtzih@gmail.com:');
    const user = await prisma.user.findUnique({
      where: { email: 'urtzih@gmail.com' },
      include: { player: { include: { groupHistories: true } } }
    });
    
    if (user && user.player) {
      console.log('  ✅ EXISTE');
      console.log('  - Player ID:', user.player.id);
      console.log('  - Nombre:', user.player.name);
      
      // Verificar asignaciones a grupos
      const playerGroups = await prisma.groupPlayer.findMany({
        where: { playerId: user.player.id },
        include: { group: { include: { season: true } } }
      });
      
      console.log('\n📍 Grupos asignados:');
      if (playerGroups.length === 0) {
        console.log('  ❌ NO ESTÁ ASIGNADO A NINGÚN GRUPO');
      } else {
        playerGroups.forEach(pg => {
          console.log(`  - ${pg.group.name} (Temporada: ${pg.group.season.name})`);
        });
      }
    } else {
      console.log('  ❌ NO EXISTE');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
