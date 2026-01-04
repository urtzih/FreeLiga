import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  // Desactivar temporada antigua
  const old = await prisma.season.findFirst({ 
    where: { name: { contains: '2025' } } 
  });
  if (old) {
    await prisma.season.update({ 
      where: { id: old.id }, 
      data: { isActive: false } 
    });
    console.log('✓ Desactivada:', old.name);
  }
  
  // Activar nueva temporada
  const newSeason = await prisma.season.findFirst({ 
    where: { name: { contains: 'Enero' } } 
  });
  if (newSeason) {
    await prisma.season.update({ 
      where: { id: newSeason.id }, 
      data: { isActive: true } 
    });
    console.log('✓ Activada:', newSeason.name);
  }
  
  await prisma.$disconnect();
}

fix();
