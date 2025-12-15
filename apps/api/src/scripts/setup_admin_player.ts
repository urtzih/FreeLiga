import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'admin@freesquash.com';

        // Find admin user and player
        const user = await prisma.user.findUnique({
            where: { email },
            include: { player: true }
        });

        if (!user || !user.player) {
            console.error('Admin user or player not found');
            return;
        }

        const player = user.player;
        console.log(`Found admin player: ${player.name} (${player.id})`);

        // Find Grupo 1
        const group = await prisma.group.findFirst({
            where: { name: 'Grupo 1' }
        });

        if (!group) {
            console.error('Grupo 1 not found');
            return;
        }

        console.log(`Assigning to group: ${group.name} (${group.id})`);

        // Check if already in group
        const existing = await prisma.groupPlayer.findUnique({
            where: {
                groupId_playerId: {
                    groupId: group.id,
                    playerId: player.id
                }
            }
        });

        if (existing) {
            console.log('Already in group');
        } else {
            await prisma.groupPlayer.create({
                data: {
                    groupId: group.id,
                    playerId: player.id,
                    rankingPosition: 999
                }
            });
            console.log('Added to group players');
        }

        // Update current group
        await prisma.player.update({
            where: { id: player.id },
            data: { currentGroupId: group.id }
        });
        console.log('Updated current group');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
