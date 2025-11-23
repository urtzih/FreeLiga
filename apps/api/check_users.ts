import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                isActive: true,
                role: true,
            },
        });

        console.log(`📊 Total de usuarios en la base de datos: ${users.length}`);
        console.log('\nUsuarios:');
        users.forEach(user => {
            console.log(`- ${user.email} (${user.role}) - isActive: ${user.isActive}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
