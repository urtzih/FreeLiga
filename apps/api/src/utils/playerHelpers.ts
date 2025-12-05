import { prisma } from '@freesquash/database';

/**
 * Obtiene el grupo actual de un jugador basándose en la temporada activa.
 * Un jugador pertenece al grupo de la temporada que tenga isActive = true.
 * 
 * @param playerId - ID del jugador
 * @returns El grupo con su información de temporada, o null si no hay temporada activa o no está en ningún grupo
 */
export async function getPlayerCurrentGroup(playerId: string) {
    // Buscar la temporada activa
    const activeSeason = await prisma.season.findFirst({
        where: { isActive: true }
    });

    if (!activeSeason) {
        return null;
    }

    // Buscar el GroupPlayer del jugador en un grupo de la temporada activa
    const groupPlayer = await prisma.groupPlayer.findFirst({
        where: {
            playerId,
            group: {
                seasonId: activeSeason.id
            }
        },
        include: {
            group: {
                include: {
                    season: true,
                    groupPlayers: {
                        include: {
                            player: true
                        },
                        orderBy: {
                            rankingPosition: 'asc'
                        }
                    }
                }
            }
        }
    });

    return groupPlayer?.group || null;
}

/**
 * Obtiene el ID del grupo actual de un jugador basándose en la temporada activa.
 * 
 * @param playerId - ID del jugador
 * @returns El ID del grupo actual, o null
 */
export async function getPlayerCurrentGroupId(playerId: string): Promise<string | null> {
    const group = await getPlayerCurrentGroup(playerId);
    return group?.id || null;
}

/**
 * Verifica si un jugador pertenece a un grupo específico en la temporada activa.
 * 
 * @param playerId - ID del jugador
 * @param groupId - ID del grupo
 * @returns true si el jugador pertenece al grupo en la temporada activa
 */
export async function isPlayerInGroupInActiveSeason(playerId: string, groupId: string): Promise<boolean> {
    const currentGroupId = await getPlayerCurrentGroupId(playerId);
    return currentGroupId === groupId;
}
