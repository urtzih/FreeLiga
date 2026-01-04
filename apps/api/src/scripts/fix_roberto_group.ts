/**
 * Script para mover a Roberto Mediavilla del Grupo 7 al Grupo 6
 * 
 * Uso: npx ts-node src/scripts/fix_roberto_group.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔄 Moviendo a Roberto Mediavilla al Grupo 6...\n");

    // Buscar al usuario Roberto Mediavilla
    const user = await prisma.user.findUnique({
      where: { email: "roberto.mediavilla@ejemplo.com" },
      include: { player: true },
    });

    if (!user || !user.player) {
      console.error("❌ Usuario no encontrado: roberto.mediavilla@ejemplo.com");
      return;
    }

    console.log(`✓ Usuario encontrado: ${user.player.name}`);

    // Obtener la temporada activa
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      include: {
        groups: {
          where: {
            OR: [{ name: "Grupo 6" }, { name: "Grupo 7" }],
          },
        },
      },
    });

    if (!activeSeason) {
      console.error("❌ No hay temporada activa");
      return;
    }

    const grupo6 = activeSeason.groups.find((g) => g.name === "Grupo 6");
    const grupo7 = activeSeason.groups.find((g) => g.name === "Grupo 7");

    if (!grupo6 || !grupo7) {
      console.error("❌ Grupos no encontrados");
      return;
    }

    // Verificar si tiene partidos jugados
    const matchesPlayed = await prisma.match.count({
      where: {
        groupId: grupo7.id,
        OR: [
          { player1Id: user.player.id },
          { player2Id: user.player.id },
        ],
        matchStatus: "PLAYED",
      },
    });

    if (matchesPlayed > 0) {
      console.warn(`⚠️  ADVERTENCIA: Roberto tiene ${matchesPlayed} partidos jugados en Grupo 7`);
      console.warn("   Considera si deberías eliminarlos antes de moverlo.");
    }

    // Eliminar de Grupo 7
    const deleted = await prisma.groupPlayer.deleteMany({
      where: {
        playerId: user.player.id,
        groupId: grupo7.id,
      },
    });

    console.log(`✓ Eliminado de ${grupo7.name}: ${deleted.count} registro(s)`);

    // Verificar si ya está en Grupo 6
    const existingInGroup6 = await prisma.groupPlayer.findUnique({
      where: {
        groupId_playerId: {
          groupId: grupo6.id,
          playerId: user.player.id,
        },
      },
    });

    if (existingInGroup6) {
      console.log(`✓ Ya está en ${grupo6.name}`);
    } else {
      // Agregar a Grupo 6
      await prisma.groupPlayer.create({
        data: {
          groupId: grupo6.id,
          playerId: user.player.id,
          rankingPosition: 0, // Se recalculará automáticamente
        },
      });

      console.log(`✓ Agregado a ${grupo6.name}`);
    }

    console.log("\n✨ ¡Cambio completado exitosamente!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
