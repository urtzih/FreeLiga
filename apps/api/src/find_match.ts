import { prisma } from '@freesquash/database';

async function findMatch() {
    const matches = await prisma.match.findMany({
        where: {
            OR: [
                {
                    player1: { name: { contains: 'Bikendi' } },
                    player2: { name: { contains: 'Oier' } }
                },
                {
                    player1: { name: { contains: 'Oier' } },
                    player2: { name: { contains: 'Bikendi' } }
                }
            ]
        },
        include: {
            player1: true,
            player2: true
        }
    });

    console.log(JSON.stringify(matches, null, 2));
}

findMatch();
