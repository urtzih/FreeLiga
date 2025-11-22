import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPasswords() {
    console.log('🔄 Iniciando reseteo de contraseñas...');

    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`🔑 Nuevo hash generado: ${hashedPassword}`);

    try {
        const result = await prisma.user.updateMany({
            data: {
                password: hashedPassword
            }
        });

        console.log(`✅ Contraseñas actualizadas para ${result.count} usuarios.`);
        console.log(`👉 Nueva contraseña para TODOS: ${password}`);

    } catch (error) {
        console.error('❌ Error actualizando contraseñas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPasswords();
