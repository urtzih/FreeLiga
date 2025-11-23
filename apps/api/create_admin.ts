import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'admin@freesquash.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN'
            },
            create: {
                email,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        console.log('Admin user created/updated:', user);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
