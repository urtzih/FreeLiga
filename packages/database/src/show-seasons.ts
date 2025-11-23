import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showAllSeasons() {
    const seasons = await prisma.season.findMany({
        orderBy: { createdAt: 'desc' }
    });
    
    console.log('📅 Temporadas en la base de datos:\n');
    for (const season of seasons) {
        const groupCount = await prisma.group.count({
            where: { seasonId: season.id }
        });
        console.log(`  ${season.name} (ID: ${season.id})`);
        console.log(`    - Grupos: ${groupCount}`);
        console.log(`    - Creada: ${season.createdAt}`);
        console.log('');
    }
    
    await prisma.$disconnect();
}

showAllSeasons();
