import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'admin@freesquash.com';

        // Find admin user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error('Admin user not found');
            return;
        }

        // Find a player to link (e.g., Ahmad F. Hamam)
        const player = await prisma.player.findFirst({
            where: { name: 'Ahmad F. Hamam' }
        });

        if (!player) {
            console.error('Player not found');
            return;
        }

        // Check if player already has a user
        if (player.userId) {
            console.log(`Player ${player.name} is already linked to user ${player.userId}`);
            if (player.userId === user.id) {
                console.log('Already linked to admin. Done.');
                return;
            }
            // Unlink previous user (optional, but for testing we want to force link)
            // But wait, if we unlink, we might break something.
            // Let's try to find if admin is linked to ANY player
        }

        const adminPlayer = await prisma.player.findUnique({
            where: { userId: user.id }
        });

        if (adminPlayer) {
            console.log(`Admin user is already linked to player ${adminPlayer.name} (${adminPlayer.id})`);
            // We can use this player for testing
            return;
        }

        console.log(`Linking user ${user.id} to player ${player.id} (${player.name})`);

        // If player was linked to another user, we might need to clear it first or just overwrite if unique constraint allows?
        // Unique constraint is on userId. So if we set userId to X, and no other player has userId X, it works.
        // But if player.userId was Y, we are changing it to X. That's fine.
        // The error "Unique constraint failed on the constraint: `players_userId_key`" usually means 
        // we are trying to set userId to X, but another player already has userId X.
        // But we just checked adminPlayer (which searches by userId X) and it was null (presumably, if we got here).

        // Wait, if adminPlayer exists, we returned.
        // So adminPlayer is null.
        // So no player has userId = admin.id.
        // So why did it fail?
        // Maybe "Ahmad F. Hamam" has a userId that conflicts? No, userId is foreign key to User.
        // The constraint is unique(userId).
        // If I update player P to have userId U.
        // If another player Q has userId U, it fails.
        // But I checked if admin is linked (adminPlayer).

        // Let's try to update.
        await prisma.player.update({
            where: { id: player.id },
            data: { userId: user.id }
        });

        console.log('Linked successfully');
    } catch (error) {
        console.error('Error linking:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
