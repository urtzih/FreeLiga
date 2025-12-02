import { prisma } from './packages/database/src/index';
import bcrypt from 'bcrypt';

// Función auxiliar para crear fechas distribuidas
function getDateRange(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}

async function seedTestUsers() {
    try {
        console.log('🌱 Iniciando seed de usuarios de prueba...');

        // Crear usuarios con fechas distribuidas a lo largo de 180 días
        const testUsers = [
            { email: 'test1@freeliga.com', name: 'Carlos López', daysAgo: 170, isActive: true },
            { email: 'test2@freeliga.com', name: 'María García', daysAgo: 160, isActive: true },
            { email: 'test3@freeliga.com', name: 'Juan Rodríguez', daysAgo: 150, isActive: false },
            { email: 'test4@freeliga.com', name: 'Ana Martínez', daysAgo: 140, isActive: true },
            { email: 'test5@freeliga.com', name: 'Pedro Sánchez', daysAgo: 130, isActive: true },
            { email: 'test6@freeliga.com', name: 'Laura González', daysAgo: 120, isActive: false },
            { email: 'test7@freeliga.com', name: 'Roberto Fernández', daysAgo: 110, isActive: true },
            { email: 'test8@freeliga.com', name: 'Isabel Ruiz', daysAgo: 100, isActive: true },
            { email: 'test9@freeliga.com', name: 'Fernando López', daysAgo: 90, isActive: true },
            { email: 'test10@freeliga.com', name: 'Cristina Díaz', daysAgo: 80, isActive: false },
            { email: 'test11@freeliga.com', name: 'Miguel Ángel', daysAgo: 70, isActive: true },
            { email: 'test12@freeliga.com', name: 'Sofía García', daysAgo: 60, isActive: true },
            { email: 'test13@freeliga.com', name: 'Antonio Jiménez', daysAgo: 50, isActive: true },
            { email: 'test14@freeliga.com', name: 'Elena Moreno', daysAgo: 40, isActive: false },
            { email: 'test15@freeliga.com', name: 'José Luis', daysAgo: 30, isActive: true },
            { email: 'test16@freeliga.com', name: 'Beatriz Torres', daysAgo: 25, isActive: true },
            { email: 'test17@freeliga.com', name: 'David Guerrero', daysAgo: 20, isActive: true },
            { email: 'test18@freeliga.com', name: 'Gloria Sáez', daysAgo: 15, isActive: false },
            { email: 'test19@freeliga.com', name: 'Oscar Herrera', daysAgo: 10, isActive: true },
            { email: 'test20@freeliga.com', name: 'Patricia Vega', daysAgo: 5, isActive: true },
        ];

        for (const userData of testUsers) {
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email },
            });

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash('Test123!', 10);
                const createdAt = getDateRange(userData.daysAgo);

                const user = await prisma.user.create({
                    data: {
                        email: userData.email,
                        password: hashedPassword,
                        role: 'PLAYER',
                        isActive: userData.isActive,
                        createdAt,
                        updatedAt: createdAt,
                    },
                });

                await prisma.player.create({
                    data: {
                        userId: user.id,
                        name: userData.name,
                        nickname: `${userData.name.split(' ')[0]}_${Math.random().toString(36).substring(7)}`,
                        createdAt,
                        updatedAt: createdAt,
                    },
                });

                console.log(`✅ Creado: ${userData.email} (${userData.name}) - hace ${userData.daysAgo} días - ${userData.isActive ? 'Activo' : 'Inactivo'}`);
            } else {
                console.log(`⏭️  Ya existe: ${userData.email}`);
            }
        }

        console.log('✨ Seed completado exitosamente');
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestUsers();
