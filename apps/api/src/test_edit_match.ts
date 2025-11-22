import { prisma } from '@freesquash/database';
import { calculateGroupRankings } from './services/ranking.service';

async function testEditMatch() {
    try {
        console.log('Starting test...');

        // 1. Get a match to edit
        const match = await prisma.match.findUnique({
            where: { id: 'cmiaa6f9s000lz5sr0ibaj1dd' },
            include: { group: true }
        });

        if (!match) {
            console.log('No played match found');
            return;
        }

        console.log(`Found match ${match.id} in group ${match.groupId}`);
        console.log(`Current result: ${match.gamesP1}-${match.gamesP2}`);

        // 2. Simulate update logic (copy-pasted from route for testing service logic)
        const newGamesP1 = match.gamesP1 === 3 ? 2 : 3;
        const newGamesP2 = match.gamesP2 === 3 ? 2 : 3;

        let winnerId = null;
        if (newGamesP1 > newGamesP2) winnerId = match.player1Id;
        else if (newGamesP2 > newGamesP1) winnerId = match.player2Id;

        console.log(`Updating to: ${newGamesP1}-${newGamesP2}`);

        await prisma.match.update({
            where: { id: match.id },
            data: {
                gamesP1: newGamesP1,
                gamesP2: newGamesP2,
                winnerId
            }
        });
        console.log('Match updated in DB');

        // 3. Test ranking calculation
        console.log('Calculating rankings...');
        await calculateGroupRankings(match.groupId);
        console.log('Rankings calculated successfully');

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testEditMatch();
