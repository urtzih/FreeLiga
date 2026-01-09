const { PrismaClient } = require('@prisma/client');

// Usar la URL de producción
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:HkwOvwLFXIpySTWoZEVaXPZhQZgPSDbo@metro.proxy.rlwy.net:26282/railway'
    }
  }
});

async function checkDetailedInfo() {
  try {
    console.log('🔍 Información detallada de urtzid@gmail.com\n');
    
    // Obtener usuario completo
    const user = await prisma.user.findUnique({
      where: { email: 'urtzid@gmail.com' },
      include: { 
        player: {
          include: {
            groupHistories: {
              include: { season: true, group: true }
            }
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('👤 Usuario:');
    console.log('  - Email:', user.email);
    console.log('  - ID:', user.id);
    console.log('  - Role:', user.role);
    console.log('  - Activo:', user.isActive);
    
    console.log('\n🎾 Player:');
    console.log('  - ID:', user.player?.id);
    console.log('  - Nombre:', user.player?.name);
    console.log('  - Apodo:', user.player?.nickname);
    console.log('  - Teléfono:', user.player?.phone);
    
    // Ver grupos actuales a través de groupPlayers
    const currentGroups = await prisma.groupPlayer.findMany({
      where: { playerId: user.player?.id },
      include: { 
        group: { 
          include: { season: true }
        }
      }
    });
    
    console.log('\n📍 Grupos actuales (groupPlayers):');
    if (currentGroups.length === 0) {
      console.log('  ❌ NO HAY GRUPOS ASIGNADOS');
    } else {
      currentGroups.forEach(gp => {
        console.log(`  - ${gp.group.name} (Temp: ${gp.group.season.name}, Posición: ${gp.rankingPosition})`);
        console.log(`    ID: ${gp.group.id}`);
      });
    }
    
    console.log('\n📜 Historial de grupos:');
    if (user.player?.groupHistories.length === 0) {
      console.log('  - Sin historial');
    } else {
      user.player?.groupHistories.forEach(gh => {
        console.log(`  - ${gh.group?.name} (${gh.season?.name})`);
      });
    }
    
    // Verificar específicamente el grupo cmk305pal008k3a0ulr9ocg1e
    console.log('\n🎯 Verificando asignación a Grupo 4 (cmk305pal008k3a0ulr9ocg1e):');
    const groupAssignment = await prisma.groupPlayer.findUnique({
      where: {
        groupId_playerId: {
          groupId: 'cmk305pal008k3a0ulr9ocg1e',
          playerId: user.player?.id || ''
        }
      },
      include: { group: true }
    });
    
    if (groupAssignment) {
      console.log('  ✅ SÍ ESTÁ ASIGNADO');
      console.log('  - Posición ranking:', groupAssignment.rankingPosition);
    } else {
      console.log('  ❌ NO ESTÁ ASIGNADO A ESTE GRUPO');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetailedInfo();
