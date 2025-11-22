import { prisma } from '@freesquash/database';
import bcrypt from 'bcrypt';

async function resetAdmin() {
    const email = 'admin@freesquash.com';
    const password = '123456';

    try {
        console.log(`Checking for user ${email}...`);

        const user = await prisma.user.findUnique({
            where: { email }
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        if (user) {
            console.log('User found. Resetting password...');
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log('Password reset successfully.');
        } else {
            console.log('User not found. Creating admin user...');
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    player: {
                        create: {
                            name: 'Administrador',
                            nickname: 'Admin',
                        }
                    }
                }
            });
            console.log('Admin user created successfully.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
