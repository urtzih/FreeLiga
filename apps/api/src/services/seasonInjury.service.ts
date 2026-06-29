import { prisma } from '@freesquash/database';
import { calculateGroupRankings } from './ranking.service';
import { cacheService } from './cache.service';
import { getPlayerCurrentGroupId } from '../utils/playerHelpers';
import { logger } from '../utils/logger';
import { MatchSyncService } from './matchSync.service';

const invalidatePlayerCache = (playerId: string) => {
    cacheService.invalidate(`private:player:${playerId}:profile`);
    cacheService.invalidate(`private:player:${playerId}:stats`);
    cacheService.invalidate(`private:player:${playerId}:progress`);
    cacheService.invalidate(`private:player:${playerId}:matches-by-date`);
    cacheService.invalidate(`private:player:${playerId}:movements`);
};

const invalidateMatchRelatedCache = async (groupId: string) => {
    cacheService.invalidate(`private:group:${groupId}:detail`);
    cacheService.invalidatePattern(`^private:classification:[^:]*:${groupId}:`);
    cacheService.invalidatePattern('^private:classification:[^:]*:all:');
};

export async function closePlayerSeasonByInjury(targetPlayerId: string, actorUserId?: string) {
    const currentGroup = await getPlayerCurrentGroupId(targetPlayerId);
    if (!currentGroup) {
        return {
            groupId: null,
            mode: 'none' as const,
            expectedMatches: 0,
            playedMatches: 0,
            updatedCount: 0,
            createdCount: 0,
            convertedPlayedMatches: 0,
        };
    }

    const group = await prisma.group.findUnique({
        where: { id: currentGroup },
        include: {
            groupPlayers: true,
        },
    });

    if (!group) {
        throw new Error('Group not found');
    }

    const expectedMatches = Math.max(group.groupPlayers.length - 1, 0);

    const playerMatches = await prisma.match.findMany({
        where: {
            groupId: group.id,
            OR: [
                { player1Id: targetPlayerId },
                { player2Id: targetPlayerId },
            ],
        },
        include: {
            player1: { select: { id: true, userId: true } },
            player2: { select: { id: true, userId: true } },
        },
    });

    const playedMatches = playerMatches.filter((m) =>
        m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null
    ).length;

    const shouldInvalidatePlayedMatches = playedMatches <= expectedMatches / 2;
    const isPlayedWithResult = (m: typeof playerMatches[number]) =>
        m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null;

    const matchesToUpdate = playerMatches.filter((m) => {
        if (m.matchStatus === 'INJURY') return false;
        if (shouldInvalidatePlayedMatches) return true;
        return !isPlayedWithResult(m);
    });
    const convertedPlayedMatches = matchesToUpdate.filter((m) => isPlayedWithResult(m)).length;

    let updatedCount = 0;
    for (const match of matchesToUpdate) {
        const opponentId = match.player1Id === targetPlayerId ? match.player2Id : match.player1Id;

        if (match.googleEventId) {
            const candidateUserIds = [
                actorUserId,
                match.player1?.userId,
                match.player2?.userId,
            ].filter(Boolean) as string[];

            for (const userId of candidateUserIds) {
                try {
                    await MatchSyncService.deleteMatchFromGoogleCalendar(match.id, userId);
                    break;
                } catch (error) {
                    logger.warn({ error, matchId: match.id, userId }, 'Failed to delete match from Google Calendar');
                }
            }
        }

        const preserveResultForPotentialRecovery = isPlayedWithResult(match);

        await prisma.match.update({
            where: { id: match.id },
            data: {
                player1Id: targetPlayerId,
                player2Id: opponentId,
                matchStatus: 'INJURY',
                gamesP1: preserveResultForPotentialRecovery ? match.gamesP1 : null,
                gamesP2: preserveResultForPotentialRecovery ? match.gamesP2 : null,
                winnerId: opponentId,
                isScheduled: false,
                scheduledDate: null,
                location: null,
                notes: null,
                googleEventId: null,
                googleCalendarSyncStatus: null,
            },
        });
        updatedCount += 1;
    }

    const opponentIds = group.groupPlayers
        .map((gp) => gp.playerId)
        .filter((id) => id !== targetPlayerId);

    const missingOpponentIds = opponentIds.filter((opponentId) => {
        return !playerMatches.some((m) =>
            (m.player1Id === targetPlayerId && m.player2Id === opponentId) ||
            (m.player1Id === opponentId && m.player2Id === targetPlayerId)
        );
    });

    let createdCount = 0;
    if (missingOpponentIds.length > 0) {
        const createData = missingOpponentIds.map((opponentId) => ({
            groupId: group.id,
            player1Id: targetPlayerId,
            player2Id: opponentId,
            matchStatus: 'INJURY' as const,
            gamesP1: null,
            gamesP2: null,
            winnerId: opponentId,
            isScheduled: false,
            date: new Date(),
        }));

        await prisma.match.createMany({ data: createData });
        createdCount = createData.length;
    }

    await calculateGroupRankings(group.id);
    await invalidateMatchRelatedCache(group.id);
    invalidatePlayerCache(targetPlayerId);
    group.groupPlayers
        .map((gp) => gp.playerId)
        .forEach((playerId) => invalidatePlayerCache(playerId));

    logger.info({
        playerId: targetPlayerId,
        groupId: group.id,
        expectedMatches,
        playedMatches,
        updatedCount,
        createdCount,
        convertedPlayedMatches,
        mode: shouldInvalidatePlayedMatches ? 'total' : 'partial',
    }, 'Player marked as injured');

    return {
        groupId: group.id,
        mode: shouldInvalidatePlayedMatches ? 'total' as const : 'partial' as const,
        expectedMatches,
        playedMatches,
        updatedCount,
        createdCount,
        convertedPlayedMatches,
    };
}
