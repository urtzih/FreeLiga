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
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    nickname: true,
                    phone: true,
                    calendarEnabled: true,
                    annualFeesPaid: true,
                    createdAt: true,
                    updatedAt: true,
                    groupPlayers: {
                        include: {
                            group: true,
                        },
                    },
                },
            });

            // Añadir grupo actual para cada jugador y parse annualFeesPaid
            const playersWithCurrentGroup = await Promise.all(
                players.map(async (player) => {
                    const currentGroup = await getPlayerCurrentGroup(player.id);
                    const fees = player.annualFeesPaid ? JSON.parse(player.annualFeesPaid) : [];
                    return { 
                        ...player, 
                        currentGroup,
                        annualFeesPaid: fees
                    };
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
            
            // Parse annualFeesPaid
            const fees = player.annualFeesPaid ? JSON.parse(player.annualFeesPaid) : [];

            return { 
                ...player, 
                currentGroup,
                annualFeesPaid: fees
            };
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
                    gamesP1: { not: null }, // Only matches with results
                    gamesP2: { not: null }, // Only matches with results
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
                // Solo contar partidos con resultado
                if (match.gamesP1 !== null && match.gamesP2 !== null) {
                    if (match.player1Id === id) {
                        setsWon += match.gamesP1;
                        setsLost += match.gamesP2;
                    } else {
                        setsWon += match.gamesP2;
                        setsLost += match.gamesP1;
                    }
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

            // Prepare update data - only include provided fields
            const updateData: any = {};
            if (body.name !== undefined) updateData.name = body.name;
            if (body.nickname !== undefined) updateData.nickname = body.nickname;
            if (body.phone !== undefined) updateData.phone = body.phone;
            // Convert array to string JSON if provided
            if (body.annualFeesPaid !== undefined) {
                if (Array.isArray(body.annualFeesPaid)) {
                    updateData.annualFeesPaid = JSON.stringify(body.annualFeesPaid.sort((a: number, b: number) => a - b));
                } else if (typeof body.annualFeesPaid === 'string') {
                    updateData.annualFeesPaid = body.annualFeesPaid;
                }
            }

            const player = await prisma.player.update({
                where: { id },
                data: updateData,
            });

            // Parse annualFeesPaid back to array for response
            return {
                ...player,
                annualFeesPaid: JSON.parse(player.annualFeesPaid || '[]')
            };
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

            const updateData: any = {
                name: body.name,
                nickname: body.nickname,
                phone: body.phone,
            };

            // Allow updating calendarEnabled
            if (body.calendarEnabled !== undefined) {
                updateData.calendarEnabled = body.calendarEnabled;
            }

            const player = await prisma.player.update({
                where: { id },
                data: updateData,
            });

            // Parse annualFeesPaid - handle null case
            const fees = player.annualFeesPaid ? JSON.parse(player.annualFeesPaid) : [];
            return {
                ...player,
                annualFeesPaid: fees,
            };
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
                // Solo contar partidos con resultado
                if (m.gamesP1 !== null && m.gamesP2 !== null) {
                    if (m.player1Id === id) { setsWon += m.gamesP1; setsLost += m.gamesP2; }
                    else { setsWon += m.gamesP2; setsLost += m.gamesP1; }
                }
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
                    matchStatus: 'PLAYED',
                    gamesP1: { not: null },
                    gamesP2: { not: null }
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

    // Update annual fees paid (admin only) 
    fastify.put('/:id/annual-fees', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            const body = request.body as { annualFeesPaid: number[] };

            // Check if user is admin
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            if (!Array.isArray(body.annualFeesPaid)) {
                return reply.status(400).send({ error: 'annualFeesPaid must be an array of years' });
            }

            // Validate all elements are numbers
            if (!body.annualFeesPaid.every(year => typeof year === 'number')) {
                return reply.status(400).send({ error: 'All elements must be numbers (years)' });
            }

            // Sort years in ascending order and convert to string JSON
            const sortedYears = body.annualFeesPaid.sort((a: number, b: number) => a - b);
            const annualFeesString = JSON.stringify(sortedYears);

            const player = await prisma.player.update({
                where: { id },
                data: { annualFeesPaid: annualFeesString },
            });

            // Parse annualFeesPaid - handle null case
            const fees = player.annualFeesPaid ? JSON.parse(player.annualFeesPaid) : [];
            return {
                ...player,
                annualFeesPaid: fees
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Toggle annual fee for current year (admin only)
    fastify.post('/:id/annual-fees/toggle/:year', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id, year } = request.params as { id: string; year: string };

            // Check if user is admin
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const yearNum = parseInt(year, 10);
            if (isNaN(yearNum)) {
                return reply.status(400).send({ error: 'Year must be a valid number' });
            }

            const player = await prisma.player.findUnique({ where: { id } });
            if (!player) {
                return reply.status(404).send({ error: 'Player not found' });
            }

            // Parse existing fees from string - handle null case
            let fees: number[] = [];
            if (player.annualFeesPaid && player.annualFeesPaid !== '[]' && player.annualFeesPaid !== null) {
                try {
                    const parsed = JSON.parse(player.annualFeesPaid);
                    fees = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    fees = [];
                }
            }
            
            const index = fees.indexOf(yearNum);
            if (index > -1) {
                // Remove year if it exists
                fees.splice(index, 1);
            } else {
                // Add year if it doesn't exist
                fees.push(yearNum);
            }

            // Sort years
            fees = fees.sort((a: number, b: number) => a - b);
            const feesString = JSON.stringify(fees);

            const updated = await prisma.player.update({
                where: { id },
                data: { annualFeesPaid: feesString },
            });

            // Parse annualFeesPaid - handle null case
            const updatedFees = updated.annualFeesPaid ? JSON.parse(updated.annualFeesPaid) : [];
            return {
                ...updated,
                annualFeesPaid: updatedFees
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Mark fee as paid + Register GDPR/Legal acceptance (admin only)
    fastify.post('/:playerId/mark-fee-paid', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { playerId } = request.params as { playerId: string };
            const { year } = request.body as { year: number };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const currentYear = new Date().getFullYear();
            if (year < 2020 || year > currentYear + 1) {
                return reply.status(400).send({ error: 'Invalid year' });
            }

            const player = await prisma.player.findUnique({
                where: { id: playerId },
                include: { user: true }
            });

            if (!player || !player.user) {
                return reply.status(404).send({ error: 'Player not found' });
            }

            const currentFees = player.annualFeesPaid ? JSON.parse(player.annualFeesPaid) : [];
            const fees = Array.isArray(currentFees) ? currentFees : [];

            if (!fees.includes(year)) {
                fees.push(year);
            }

            fees.sort((a: number, b: number) => a - b);
            const feesString = JSON.stringify(fees);

            const userUpdateData: any = {
                termsAcceptanceMethod: 'fee_payment'
            };
            const existingUserAsAny = player.user as any;
            if (!existingUserAsAny.termsAcceptedAt) {
                userUpdateData.termsAcceptedAt = new Date();
            }
            if (!existingUserAsAny.privacyAcceptedAt) {
                userUpdateData.privacyAcceptedAt = new Date();
            }

            const [updatedPlayer, updatedUser] = await prisma.$transaction([
                prisma.player.update({
                    where: { id: playerId },
                    data: { annualFeesPaid: feesString },
                }),
                prisma.user.update({
                    where: { id: player.user.id },
                    data: userUpdateData
                })
            ]);

            const updatedFees = updatedPlayer.annualFeesPaid ? JSON.parse(updatedPlayer.annualFeesPaid) : [];
            return {
                player: {
                    ...updatedPlayer,
                    annualFeesPaid: updatedFees
                },
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email
                },
                message: `Cuota pagada para ${year} - Términos y condiciones aceptados automáticamente`
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get blacklist (players with fewer matches) - Current Season
    fastify.get('/blacklist/current', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            // Get active season
            const activeSeason = await prisma.season.findFirst({
                where: { isActive: true },
                include: {
                    groups: {
                        include: {
                            groupPlayers: {
                                where: {
                                    player: {
                                        user: {
                                            isActive: true,
                                        },
                                    },
                                },
                                include: {
                                    player: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!activeSeason) {
                return reply.status(404).send({ error: 'No active season found' });
            }

            const groupIds = activeSeason.groups.map(g => g.id);

            // Build expected matches by active group membership (round-robin: each player vs others once)
            const playersMap = new Map<string, {
                id: string;
                name: string;
                nickname: string | null;
                groupNames: Set<string>;
                expectedMatches: number;
            }>();

            for (const group of activeSeason.groups) {
                const groupPlayers = group.groupPlayers;
                const expectedPerPlayer = Math.max(groupPlayers.length - 1, 0);

                for (const gp of groupPlayers) {
                    const existing = playersMap.get(gp.playerId);
                    if (existing) {
                        existing.groupNames.add(group.name);
                        existing.expectedMatches += expectedPerPlayer;
                    } else {
                        playersMap.set(gp.playerId, {
                            id: gp.player.id,
                            name: gp.player.name,
                            nickname: gp.player.nickname,
                            groupNames: new Set([group.name]),
                            expectedMatches: expectedPerPlayer,
                        });
                    }
                }
            }

            const playersInActiveSeason = Array.from(playersMap.values());

            // Calculate played/injury matches for each player in active season
            const blacklistData = await Promise.all(
                playersInActiveSeason.map(async (player) => {
                    const playedMatches = await prisma.match.count({
                        where: {
                            groupId: { in: groupIds },
                            OR: [
                                { player1Id: player.id },
                                { player2Id: player.id },
                            ],
                            gamesP1: { not: null },
                            gamesP2: { not: null },
                            matchStatus: { not: 'INJURY' },
                        },
                    });

                    const injuredMatches = await prisma.match.count({
                        where: {
                            groupId: { in: groupIds },
                            OR: [
                                { player1Id: player.id },
                                { player2Id: player.id },
                            ],
                            matchStatus: 'INJURY',
                        },
                    });

                    const remainingMatches = Math.max(player.expectedMatches - playedMatches - injuredMatches, 0);

                    return {
                        id: player.id,
                        name: player.name,
                        nickname: player.nickname,
                        groupName: Array.from(player.groupNames).join(', '),
                        playedMatches,
                        injuredMatches,
                        totalMatches: player.expectedMatches,
                        remainingMatches,
                    };
                })
            );

            // Show players from active season that still have pending matches (including 0 played)
            const filtered = blacklistData.filter(p => p.totalMatches > 0 && p.remainingMatches > 0);

            // Sort by remaining matches (descending), then by played matches (ascending)
            const sorted = filtered.sort((a, b) => {
                if (b.remainingMatches !== a.remainingMatches) {
                    return b.remainingMatches - a.remainingMatches;
                }
                return a.playedMatches - b.playedMatches;
            });

            return sorted;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get blacklist (players with fewer matches) - Historical (all participated seasons)
    fastify.get('/blacklist/history', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const seasons = await prisma.season.findMany({
                include: {
                    groups: {
                        include: {
                            groupPlayers: {
                                where: {
                                    player: {
                                        user: {
                                            isActive: true,
                                        },
                                    },
                                },
                                include: {
                                    player: true,
                                },
                            },
                        },
                    },
                },
            });

            const allGroupIds = seasons.flatMap(s => s.groups.map(g => g.id));

            const playersMap = new Map<string, {
                id: string;
                name: string;
                nickname: string | null;
                groupNames: Set<string>;
                expectedMatches: number;
            }>();

            for (const season of seasons) {
                for (const group of season.groups) {
                    const groupPlayers = group.groupPlayers;
                    const expectedPerPlayer = Math.max(groupPlayers.length - 1, 0);

                    for (const gp of groupPlayers) {
                        const existing = playersMap.get(gp.playerId);
                        if (existing) {
                            existing.groupNames.add(group.name);
                            existing.expectedMatches += expectedPerPlayer;
                        } else {
                            playersMap.set(gp.playerId, {
                                id: gp.player.id,
                                name: gp.player.name,
                                nickname: gp.player.nickname,
                                groupNames: new Set([group.name]),
                                expectedMatches: expectedPerPlayer,
                            });
                        }
                    }
                }
            }

            const playersInHistory = Array.from(playersMap.values());

            const blacklistData = await Promise.all(
                playersInHistory.map(async (player) => {
                    const playedMatches = await prisma.match.count({
                        where: {
                            groupId: { in: allGroupIds },
                            OR: [
                                { player1Id: player.id },
                                { player2Id: player.id },
                            ],
                            gamesP1: { not: null },
                            gamesP2: { not: null },
                            matchStatus: { not: 'INJURY' },
                        },
                    });

                    const injuredMatches = await prisma.match.count({
                        where: {
                            groupId: { in: allGroupIds },
                            OR: [
                                { player1Id: player.id },
                                { player2Id: player.id },
                            ],
                            matchStatus: 'INJURY',
                        },
                    });

                    const remainingMatches = Math.max(player.expectedMatches - playedMatches - injuredMatches, 0);

                    return {
                        id: player.id,
                        name: player.name,
                        nickname: player.nickname,
                        groupName: Array.from(player.groupNames).join(', '),
                        playedMatches,
                        injuredMatches,
                        totalMatches: player.expectedMatches,
                        remainingMatches,
                    };
                })
            );

            const filtered = blacklistData.filter(p => p.totalMatches > 0 && p.remainingMatches > 0);

            const sorted = filtered.sort((a, b) => {
                if (b.remainingMatches !== a.remainingMatches) {
                    return b.remainingMatches - a.remainingMatches;
                }
                return a.playedMatches - b.playedMatches;
            });

            return sorted;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
