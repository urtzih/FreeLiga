import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@freesquash.com' },
        });

        if (existingAdmin) {
            console.log('⚠️  El usuario admin ya existe');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: 'admin@freesquash.com',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
            },
        });

        console.log('✅ Usuario admin creado exitosamente:');
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   isActive: ${admin.isActive}`);
        console.log(`   Password: admin123`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
