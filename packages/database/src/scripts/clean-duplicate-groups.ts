import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateGroups() {
    console.log('🧹 Limpiando grupos duplicados...\n');
    
    // Obtener la temporada Ciclo 25-26/11-12
    const season = await prisma.season.findFirst({
        where: { name: 'Ciclo 25-26/11-12' }
    });
    
    if (!season) {
        console.log('❌ No se encontró la temporada Ciclo 25-26/11-12');
        await prisma.$disconnect();
        return;
    }
    
    // Obtener todos los grupos de esta temporada
    const groups = await prisma.group.findMany({
        where: { seasonId: season.id },
        orderBy: { createdAt: 'asc' },
        include: {
            _count: {
                select: { groupPlayers: true }
            }
        }
    });
    
    console.log(`📊 Total grupos encontrados: ${groups.length}`);
    
    // Identificar duplicados por nombre
    const groupsByName = new Map<string, typeof groups>();
    groups.forEach((group: typeof groups[0]) => {
        const existing = groupsByName.get(group.name) || [];
        existing.push(group);
        groupsByName.set(group.name, existing);
    });
    
    // Eliminar duplicados (mantener el primero)
    let deleted = 0;
    for (const [name, groupList] of groupsByName.entries()) {
        if (groupList.length > 1) {
            console.log(`\n🔍 ${name}: ${groupList.length} duplicados encontrados`);
            
            // Mantener el primero (más antiguo), eliminar el resto
            const toKeep = groupList[0];
            const toDelete = groupList.slice(1);
            
            console.log(`  ✓ Manteniendo: ${toKeep.id} (${toKeep._count.groupPlayers} jugadores)`);
            
            for (const group of toDelete) {
                console.log(`  ✗ Eliminando: ${group.id} (${group._count.groupPlayers} jugadores)`);
                
                // Eliminar relaciones GroupPlayer
                await prisma.groupPlayer.deleteMany({
                    where: { groupId: group.id }
                });
                
                // Actualizar jugadores que tengan este grupo como currentGroup
                await prisma.player.updateMany({
                    where: { currentGroupId: group.id },
                    data: { currentGroupId: toKeep.id }
                });
                
                // Eliminar el grupo
                await prisma.group.delete({
                    where: { id: group.id }
                });
                
                deleted++;
            }
        }
    }
    
    console.log(`\n✅ Limpieza completada: ${deleted} grupos eliminados`);
    
    // Verificar resultado final
    const finalGroups = await prisma.group.findMany({
        where: { seasonId: season.id },
        include: {
            _count: {
                select: { groupPlayers: true }
            }
        }
    });
    
    console.log(`\n📋 Grupos restantes: ${finalGroups.length}`);
    finalGroups.forEach(g => {
        console.log(`  - ${g.name}: ${g._count.groupPlayers} jugadores`);
    });
    
    await prisma.$disconnect();
}

cleanDuplicateGroups()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
