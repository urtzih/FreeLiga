const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const players = await prisma.player.count();
  const seasons = await prisma.season.count();
  const groups = await prisma.group.count();
  const matches = await prisma.match.count();

  console.log('\n📊 DATABASE STATUS:');
  console.log(`Users:     ${users}`);
  console.log(`Players:   ${players}`);
  console.log(`Seasons:   ${seasons}`);
  console.log(`Groups:    ${groups}`);
  console.log(`Matches:   ${matches}\n`);

  if (users === 0) {
    console.log('❌ DATABASE IS EMPTY - All data was deleted');
  } else {
    console.log('✅ Database has data');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
