import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteOldSeasons() {
    console.log('🗑️  Eliminando temporadas antiguas...\n');
    
    // Obtener todas las temporadas excepto Ciclo 25-26/11-12
    const seasons = await prisma.season.findMany({
        where: {
            name: {
                not: 'Ciclo 25-26/11-12'
            }
        },
        include: {
            _count: {
                select: { groups: true }
            }
        }
    });
    
    console.log(`📊 Temporadas a eliminar: ${seasons.length}\n`);
    
    for (const season of seasons) {
        console.log(`🗑️  Eliminando temporada: ${season.name} (${season._count.groups} grupos)`);
        
        // Obtener grupos de esta temporada
        const groups = await prisma.group.findMany({
            where: { seasonId: season.id }
        });
        
        // Eliminar cada grupo y sus relaciones
        for (const group of groups) {
            console.log(`   - Eliminando ${group.name}...`);
            
            // Eliminar partidos del grupo
            await prisma.match.deleteMany({
                where: { groupId: group.id }
            });
            
            // Eliminar relaciones GroupPlayer
            await prisma.groupPlayer.deleteMany({
                where: { groupId: group.id }
            });
            
            // Actualizar jugadores que tengan este grupo como currentGroup
            await prisma.player.updateMany({
                where: { currentGroupId: group.id },
                data: { currentGroupId: null }
            });
            
            // Eliminar el grupo
            await prisma.group.delete({
                where: { id: group.id }
            });
        }
        
        // Eliminar la temporada
        await prisma.season.delete({
            where: { id: season.id }
        });
        
        console.log(`   ✅ Temporada ${season.name} eliminada\n`);
    }
    
    console.log('✅ Limpieza completada');
    
    // Verificar resultado final
    const remainingSeasons = await prisma.season.findMany({
        include: {
            _count: {
                select: { groups: true }
            }
        }
    });
    
    console.log('\n📋 Temporadas restantes:');
    for (const season of remainingSeasons) {
        console.log(`  - ${season.name}: ${season._count.groups} grupos`);
    }
    
    await prisma.$disconnect();
}

deleteOldSeasons()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
