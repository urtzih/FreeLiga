import { prisma } from '@freesquash/database';

async function testMeEndpoint() {
    try {
        // Buscar el usuario
        const user = await prisma.user.findFirst({
            where: {
                email: 'jon.toña.example@freesquash.com'
            },
            include: {
                player: true,
            }
        });

        console.log('\n=== USER FROM DB ===');
        console.log(JSON.stringify(user, null, 2));

        if (!user?.player) {
            console.log('No player found');
            return;
        }

        // Simular getPlayerCurrentGroup
        console.log('\n=== TESTING getPlayerCurrentGroup ===');
        
        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true }
        });
        console.log('Active season:', activeSeason?.name, activeSeason?.id);

        if (activeSeason) {
            const groupPlayer = await prisma.groupPlayer.findFirst({
                where: {
                    playerId: user.player.id,
                    group: {
                        seasonId: activeSeason.id
                    }
                },
                include: {
                    group: {
                        include: {
                            season: true
                        }
                    }
                }
            });

            console.log('\nGroupPlayer found:');
            console.log(JSON.stringify(groupPlayer, null, 2));

            const currentGroup = groupPlayer?.group || null;
            console.log('\nCurrent group:', currentGroup?.name);

            // Simular respuesta /me
            const response = {
                id: user.id,
                email: user.email,
                role: user.role,
                player: user.player ? {
                    ...user.player,
                    currentGroup
                } : null,
            };

            console.log('\n=== RESPONSE /me ===');
            console.log(JSON.stringify(response, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMeEndpoint();
