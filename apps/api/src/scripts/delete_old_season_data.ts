/**
 * Script para eliminar permanentemente datos de temporadas inactivas
 * - Elimina grupos de temporadas no activas
 * - Elimina matches, groupPlayers, promotion records, etc.
 * - Mantiene solo la temporada activa
 * 
 * Uso: npx ts-node src/scripts/delete_old_season_data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔄 Eliminando datos de temporadas antiguas...\n");

    // Obtener la temporada activa
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    if (!activeSeason) {
      console.error("❌ No hay temporada activa");
      return;
    }

    console.log(`✓ Temporada activa: ${activeSeason.name}\n`);

    // Obtener todas las temporadas inactivas
    const oldSeasons = await prisma.season.findMany({
      where: { 
        id: { not: activeSeason.id },
        isActive: false,
      },
      include: {
        groups: {
          select: { id: true, name: true },
        },
      },
    });

    if (oldSeasons.length === 0) {
      console.log("✓ No hay temporadas antiguas para eliminar");
      return;
    }

    console.log(`📋 Temporadas a eliminar: ${oldSeasons.length}`);
    oldSeasons.forEach(s => {
      console.log(`  - ${s.name} (${s.groups.length} grupos)`);
    });

    const oldSeasonIds = oldSeasons.map(s => s.id);
    const oldGroupIds = oldSeasons.flatMap(s => s.groups.map(g => g.id));

    console.log(`\n🗑️  Eliminando datos en cascada...\n`);

    // 1. Eliminar matches de grupos antiguos
    const matchesDeleted = await prisma.match.deleteMany({
      where: {
        groupId: { in: oldGroupIds },
      },
    });
    console.log(`  ✓ ${matchesDeleted.count} matches eliminados`);

    // 2. Eliminar groupPlayers de grupos antiguos
    const groupPlayersDeleted = await prisma.groupPlayer.deleteMany({
      where: {
        groupId: { in: oldGroupIds },
      },
    });
    console.log(`  ✓ ${groupPlayersDeleted.count} asignaciones jugador-grupo eliminadas`);

    // 3. Eliminar promotion records
    const promotionsDeleted = await prisma.promotionRecord.deleteMany({
      where: {
        fromGroup: {
          seasonId: { in: oldSeasonIds },
        },
      },
    });
    console.log(`  ✓ ${promotionsDeleted.count} registros de promoción eliminados`);

    // 4. Eliminar season closures
    const closuresDeleted = await prisma.seasonClosure.deleteMany({
      where: {
        seasonId: { in: oldSeasonIds },
      },
    });
    console.log(`  ✓ ${closuresDeleted.count} cierres de temporada eliminados`);

    // 5. Eliminar grupos antiguos
    const groupsDeleted = await prisma.group.deleteMany({
      where: {
        id: { in: oldGroupIds },
      },
    });
    console.log(`  ✓ ${groupsDeleted.count} grupos eliminados`);

    // 6. Eliminar temporadas antiguas
    const seasonsDeleted = await prisma.season.deleteMany({
      where: {
        id: { in: oldSeasonIds },
      },
    });
    console.log(`  ✓ ${seasonsDeleted.count} temporadas eliminadas`);

    console.log(`\n✨ ¡Limpieza completada exitosamente!`);
    console.log(`\n📊 Resumen:`);
    console.log(`  - Temporada activa conservada: ${activeSeason.name}`);
    console.log(`  - Temporadas eliminadas: ${seasonsDeleted.count}`);
    console.log(`  - Grupos eliminados: ${groupsDeleted.count}`);
    console.log(`  - Matches eliminados: ${matchesDeleted.count}`);
    console.log(`  - Asignaciones eliminadas: ${groupPlayersDeleted.count}`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
