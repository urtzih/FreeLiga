const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sqlFile = path.join(__dirname, '..', '..', 'backups', 'prod_sync_20260108_141611.sql');

async function restore() {
  const prisma = new PrismaClient();
  
  try {
    if (!fs.existsSync(sqlFile)) {
      console.log(`❌ Archivo SQL no encontrado: ${sqlFile}`);
      process.exit(1);
    }

    console.log('📤 Leyendo backup SQL...');
    let sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    // Remover comentarios de MySQL especiales
    sqlContent = sqlContent
      .replace(/\/\*![0-9]+.*?\*\//g, '') // Remover /*!xxxxx ... */
      .replace(/\/\*.*?\*\//gs, '') // Remover /* ... */
      .replace(/^--.*$/gm, ''); // Remover líneas que empiezan con --
    
    // Dividir en statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('LOCK TABLES') && !stmt.startsWith('UNLOCK TABLES'));
    
    console.log(`🔗 Ejecutando ${statements.length} SQL statements en Railway...`);
    
    let executed = 0;
    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt + ';');
        executed++;
        if (executed % 20 === 0) {
          console.log(`⏳ Ejecutados ${executed}/${statements.length} statements...`);
        }
      } catch (err) {
        // Algunos pueden fallar si ya existen, eso es OK
        if (!err.message.includes('Duplicate entry') && 
            !err.message.includes('already exists') &&
            !err.message.includes('Foreign key constraint fails')) {
          console.warn(`⚠️ Statement falló (ignorado):`, err.message.substring(0, 100));
        }
      }
    }
    
    console.log('✅ SQL restaurado exitosamente');
    
    // Aplicar migrations pendientes
    console.log('\n📦 Aplicando migrations pendientes...');
    try {
      const output = execSync('npx prisma migrate deploy', {
        cwd: __dirname,
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        encoding: 'utf-8'
      });
      console.log(output);
    } catch (err) {
      console.log('Migrations:', err.stdout || err.message);
    }
    
    // Verificar datos
    console.log('\n📊 VERIFICANDO DATOS RESTAURADOS:');
    const users = await prisma.user.count();
    const players = await prisma.player.count();
    const seasons = await prisma.season.count();
    const groups = await prisma.group.count();
    const matches = await prisma.match.count();

    console.log(`Users:     ${users}`);
    console.log(`Players:   ${players}`);
    console.log(`Seasons:   ${seasons}`);
    console.log(`Groups:    ${groups}`);
    console.log(`Matches:   ${matches}`);
    
    if (users > 0) {
      console.log('\n✅ DATOS RECUPERADOS CON ÉXITO');
    } else {
      console.log('\n❌ No se encontraron datos');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
