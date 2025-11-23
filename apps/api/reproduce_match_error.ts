import axios from 'axios';

async function main() {
    try {
        // Login first to get token
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@freesquash.com',
            password: 'admin'
        });

        const token = loginResponse.data.token;
        console.log('Logged in, token obtained');

        // Fetch group with token
        console.log('Fetching group...');
        const groupResponse = await axios.get('http://localhost:3001/api/groups/cmianqh2y000234k11pg95kkt', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const group = groupResponse.data;

        if (!group || !group.groupPlayers || group.groupPlayers.length < 2) {
            console.error('Group not found or not enough players');
            return;
        }

        const player1Id = group.groupPlayers[0].playerId;
        const player2Id = group.groupPlayers[1].playerId;

        console.log(`Attempting to create match between ${player1Id} and ${player2Id}`);

        const matchData = {
            groupId: 'cmianqh2y000234k11pg95kkt',
            player1Id: player1Id,
            player2Id: player2Id,
            gamesP1: 3,
            gamesP2: 0,
            matchStatus: 'PLAYED',
            date: "2025-11-23"
        };

        const response = await axios.post('http://localhost:3001/api/matches', matchData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Match created successfully:', response.data);
    } catch (error: any) {
        console.error('Error creating match:', error.response?.data || error.message);
    }
}

main();
