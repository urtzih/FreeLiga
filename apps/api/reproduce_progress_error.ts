import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Login as admin to get token
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@freesquash.com',
            password: 'admin'
        });
        const token = loginResponse.data.token;
        console.log('Logged in.');

        // 2. Find a player to test with (e.g., one with matches)
        const player = await prisma.player.findFirst({
            where: {
                matchesAsPlayer1: { some: {} }
            }
        });

        if (!player) {
            console.log('No player found with matches.');
            return;
        }

        console.log(`Testing with player: ${player.name} (${player.id})`);

        // 3. Fetch matches-by-date
        console.log('Fetching matches-by-date...');
        const matchesResponse = await axios.get(`http://localhost:3001/api/players/${player.id}/matches-by-date`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Matches data:', JSON.stringify(matchesResponse.data, null, 2));

        // 4. Fetch movements
        console.log('Fetching movements...');
        const movementsResponse = await axios.get(`http://localhost:3001/api/players/${player.id}/movements`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Movements data:', JSON.stringify(movementsResponse.data, null, 2));

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
