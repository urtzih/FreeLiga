import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGroups() {
    const groups = await prisma.group.findMany({
        include: { season: true },
        orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total grupos: ${groups.length}`);
    
    const bySeason = new Map<string, number>();
    groups.forEach(g => {
        const count = bySeason.get(g.season.name) || 0;
        bySeason.set(g.season.name, count + 1);
    });
    
    console.log('\nGrupos por temporada:');
    bySeason.forEach((count, season) => {
        console.log(`  ${season}: ${count} grupos`);
    });
    
    await prisma.$disconnect();
}

checkGroups();
