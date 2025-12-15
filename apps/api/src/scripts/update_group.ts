import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const group = await prisma.group.update({
            where: { id: 'cmianqh2y000234k11pg95kkt' },
            data: { whatsappUrl: 'https://chat.whatsapp.com/test-group-link' }
        });
        console.log('Group updated:', group);
    } catch (error) {
        console.error('Error updating group:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
