import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDuplicateSeason() {
    console.log('🗑️  Eliminando temporada duplicada...\n');
    
    // ID de la temporada más reciente (duplicada)
    const duplicateSeasonId = 'cmianqwwh0000105uwzvzr57t';
    
    // Obtener grupos de esta temporada
    const groups = await prisma.group.findMany({
        where: { seasonId: duplicateSeasonId },
        include: {
            _count: {
                select: { groupPlayers: true }
            }
        }
    });
    
    console.log(`📊 Grupos a eliminar: ${groups.length}`);
    
    // Eliminar cada grupo y sus relaciones
    for (const group of groups) {
        console.log(`  🗑️  Eliminando ${group.name} (${group._count.groupPlayers} jugadores)...`);
        
        // Eliminar relaciones GroupPlayer
        await prisma.groupPlayer.deleteMany({
            where: { groupId: group.id }
        });
        
        // Actualizar jugadores que tengan este grupo como currentGroup (ponerlo a null)
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
        where: { id: duplicateSeasonId }
    });
    
    console.log('\n✅ Temporada duplicada eliminada correctamente');
    
    // Verificar resultado final
    const remainingSeasons = await prisma.season.findMany({
        orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📋 Temporadas restantes:');
    for (const season of remainingSeasons) {
        const groupCount = await prisma.group.count({
            where: { seasonId: season.id }
        });
        console.log(`  - ${season.name}: ${groupCount} grupos`);
    }
    
    await prisma.$disconnect();
}

deleteDuplicateSeason()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
