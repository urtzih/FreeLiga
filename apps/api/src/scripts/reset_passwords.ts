import { prisma } from '@freesquash/database';
import bcrypt from 'bcrypt';

async function checkAndResetPasswords() {
    try {
        console.log('Checking users...');

        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: ['admin@freesquash.com', 'oier.quesada@freesquash.com']
                }
            },
            include: {
                player: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log('Found users:', JSON.stringify(users.map(u => ({ email: u.email, role: u.role, playerName: u.player?.name })), null, 2));

        // Reset passwords to 'password123'
        const newPassword = await bcrypt.hash('password123', 10);

        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: newPassword }
            });
            console.log(`✅ Password reset for ${user.email} to 'password123'`);
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkAndResetPasswords();
