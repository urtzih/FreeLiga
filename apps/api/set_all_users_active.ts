import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAllUsersActive() {
    try {
        const result = await prisma.user.updateMany({
            data: {
                isActive: true,
            },
        });

        console.log(`✅ Actualizado: ${result.count} usuarios ahora están activos`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setAllUsersActive();
