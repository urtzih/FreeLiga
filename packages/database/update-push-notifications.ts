// Script para actualizar usuarios existentes a pushNotificationsEnabled = false (local only)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        pushNotificationsEnabled: true,
      },
      data: {
        pushNotificationsEnabled: false,
      },
    });

    console.log(`✅ Actualizado: ${result.count} usuarios a pushNotificationsEnabled = false`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
