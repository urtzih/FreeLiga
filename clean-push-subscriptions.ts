// Script para limpiar subscriptions viejas
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const userId = 'cmk301q4k002d3a0uh6oxw1rw'; // Tu usuario
    
    const deleted = await prisma.pushSubscription.deleteMany({
      where: { userId },
    });

    console.log(`✅ Eliminadas ${deleted.count} subscriptions viejas para ${userId}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
