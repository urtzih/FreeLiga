const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const db = new PrismaClient();

(async () => {
  try {
    const hashed = await bcrypt.hash('123456', 10);
    await db.user.update({
      where: { email: 'urtzid@gmail.com' },
      data: { password: hashed }
    });
    console.log('✅ Contraseña restablecida a: 123456');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await db.$disconnect();
  }
})();
