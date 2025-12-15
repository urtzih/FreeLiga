import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { getPlayerCurrentGroup } from '../utils/playerHelpers';

export async function playerRoutes(fastify: FastifyInstance) {
    // Get all players
    fastify.get('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const players = await prisma.player.findMany({
                include: {
                    groupPlayers: {
                        include: {
                            group: true,
                        },
                    },
                },
            });

            // Añadir grupo actual para cada jugador
            const playersWithCurrentGroup = await Promise.all(
                players.map(async (player) => {
                    const currentGroup = await getPlayerCurrentGroup(player.id);
                    return { ...player, currentGroup };
                })
            );

            return playersWithCurrentGroup;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get player by ID with statistics
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const player = await prisma.player.findUnique({
                where: { id },
                include: {
                    groupPlayers: {
                        include: {
                            group: { include: { season: true } },
                        },
                    },
                    user: {
                        select: { email: true, role: true },
                    },
                },
            });

            if (!player) {
                return reply.status(404).send({ error: 'Player not found' });
            }

            // Añadir grupo actual
            const currentGroup = await getPlayerCurrentGroup(player.id);

            return { ...player, currentGroup };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get player statistics
    fastify.get('/:id/stats', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            // Get all matches for this player
            const matches = await prisma.match.findMany({
                where: {
                    OR: [
                        { player1Id: id },
                        { player2Id: id },
                    ],
                    matchStatus: 'PLAYED', // Only count played matches
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true,
                },
            });

            // Calculate statistics
            const wins = matches.filter(m => m.winnerId === id).length;
            const losses = matches.filter(m => m.winnerId && m.winnerId !== id).length;
            const totalMatches = wins + losses;
            const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

            // Calculate sets won and lost
            let setsWon = 0;
            let setsLost = 0;

            matches.forEach(match => {
                if (match.player1Id === id) {
                    setsWon += match.gamesP1;
                    setsLost += match.gamesP2;
                } else {
                    setsWon += match.gamesP2;
                    setsLost += match.gamesP1;
                }
            });

            const average = setsWon - setsLost;

            // Calculate current streak
            const sortedMatches = matches
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let currentStreak = 0;
            let lastResult = '';

            for (const match of sortedMatches) {
                const won = match.winnerId === id;
                const result = won ? 'W' : 'L';

                if (lastResult === '') {
                    lastResult = result;
                    currentStreak = 1;
                } else if (lastResult === result) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            return {
                playerId: id,
                totalMatches,
                wins,
                losses,
                winPercentage: parseFloat(winPercentage.toFixed(2)),
                setsWon,
                setsLost,
                average,
                currentStreak: lastResult === 'W' ? currentStreak : -currentStreak,
                recentMatches: sortedMatches.slice(0, 5),
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update player (admin only)
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            const body = request.body as any;

            // Check if user is admin
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const player = await prisma.player.update({
                where: { id },
                data: {
                    name: body.name,
                    nickname: body.nickname,
                    phone: body.phone,
                    email: body.email,
                },
            });

            return player;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update own profile (player can update their own data)
    fastify.patch('/:id/profile', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            const body = request.body as any;

            // Get the player associated with the current user
            const userPlayer = await prisma.player.findUnique({
                where: { userId: decoded.id }
            });

            // Check if user is trying to update their own profile
            if (userPlayer?.id !== id && decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'You can only update your own profile' });
            }

            const player = await prisma.player.update({
                where: { id },
                data: {
                    name: body.name,
                    nickname: body.nickname,
                    phone: body.phone,
                    email: body.email,
                },
            });

            return player;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Player progress (time series cumulative stats)
    fastify.get('/:id/progress', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const player = await prisma.player.findUnique({ where: { id } });
            if (!player) return reply.status(404).send({ error: 'Player not found' });

            const matches = await prisma.match.findMany({
                where: {
                    OR: [ { player1Id: id }, { player2Id: id } ],
                    matchStatus: 'PLAYED'
                },
                orderBy: { date: 'asc' }
            });

            let wins = 0, losses = 0, setsWon = 0, setsLost = 0;
            const points: Array<{ date: string; wins: number; losses: number; winPercentage: number; setsWon: number; setsLost: number; average: number }> = [];
            for (const m of matches) {
                const won = m.winnerId === id;
                if (won) wins++; else if (m.winnerId) losses++;
                if (m.player1Id === id) { setsWon += m.gamesP1; setsLost += m.gamesP2; }
                else { setsWon += m.gamesP2; setsLost += m.gamesP1; }
                const total = wins + losses;
                const winPercentage = total > 0 ? +(wins / total * 100).toFixed(2) : 0;
                points.push({
                    date: m.date.toISOString(),
                    wins,
                    losses,
                    winPercentage,
                    setsWon,
                    setsLost,
                    average: setsWon - setsLost
                });
            }

            // Monthly aggregation
            const monthly: Record<string, { wins: number; losses: number; setsWon: number; setsLost: number }> = {};
            for (const p of points) {
                const monthKey = p.date.substring(0,7); // YYYY-MM
                if (!monthly[monthKey]) monthly[monthKey] = { wins: 0, losses: 0, setsWon: 0, setsLost: 0 };
                monthly[monthKey].wins = p.wins;
                monthly[monthKey].losses = p.losses;
                monthly[monthKey].setsWon = p.setsWon;
                monthly[monthKey].setsLost = p.setsLost;
            }
            const monthlyPoints = Object.entries(monthly).map(([month, v]) => ({
                month,
                wins: v.wins,
                losses: v.losses,
                winPercentage: (v.wins + v.losses) > 0 ? +(v.wins / (v.wins + v.losses) * 100).toFixed(2) : 0,
                average: v.setsWon - v.setsLost
            }));

            return { playerId: id, points, monthly: monthlyPoints };
        } catch (error) {
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get matches by date (for progress chart)
    fastify.get('/:id/matches-by-date', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const matches = await prisma.match.findMany({
                where: {
                    OR: [ { player1Id: id }, { player2Id: id } ],
                    matchStatus: 'PLAYED'
                },
                include: { player1: true, player2: true },
                orderBy: { date: 'asc' }
            });

            return matches.map(m => {
                const isPlayer1 = m.player1Id === id;
                const won = m.winnerId === id;
                return {
                    date: m.date.toISOString().split('T')[0],
                    result: won ? 'WIN' : 'LOSS',
                    opponent: isPlayer1 ? m.player2.name : m.player1.name,
                    score: isPlayer1 ? `${m.gamesP1}-${m.gamesP2}` : `${m.gamesP2}-${m.gamesP1}`
                };
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get player movement history (promotions/relegations)
    fastify.get('/:id/movements', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const history = await prisma.playerGroupHistory.findMany({
                where: { playerId: id },
                include: { season: true, group: true },
                orderBy: { season: { startDate: 'asc' } }
            });

            return history.map(h => ({
                seasonName: h.season.name,
                seasonEndDate: h.season.endDate,
                groupName: h.group?.name || 'Sin grupo',
                movement: h.movementType || 'STAY',
                finalRank: h.finalRank || 0
            }));
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
