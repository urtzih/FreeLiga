#!/usr/bin/env node

/**
 * Script para verificar login y usuarios admin
 */

const mysql = require('mysql2/promise');

async function checkLogin() {
    console.log('\n🔍 Verificando credenciales de login...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'rootpassword',
        database: 'railway'
    });

    try {
        // 1. Check users
        const [users] = await connection.query(`
            SELECT id, email, role FROM users ORDER BY createdAt DESC LIMIT 10
        `);

        console.log('📊 Usuarios en BD:\n');
        if (users.length === 0) {
            console.log('❌ NO HAY USUARIOS EN LA BD - Debes crear uno primero');
        } else {
            users.forEach((user) => {
                console.log(`  • ${user.email} (${user.role})`);
            });
        }

        // 2. Check admin specifically
        const [admin] = await connection.query(`
            SELECT id, email, role, isActive FROM users WHERE role = 'ADMIN' LIMIT 1
        `);

        if (admin.length > 0) {
            console.log(`\n✓ Admin encontrado: ${admin[0].email}`);
            console.log(`  ID: ${admin[0].id}`);
            console.log(`  Activo: ${admin[0].isActive ? 'SÍ' : 'NO'}`);
        } else {
            console.log('\n⚠️  No hay usuarios ADMIN en la BD');
        }

        // 3. Check player
        const [players] = await connection.query(`
            SELECT COUNT(*) as total FROM players
        `);

        console.log(`\n📋 Jugadores: ${players[0].total}`);

        // 4. Sugerir usuario de prueba
        console.log('\n💡 Para probar login, usa cualquiera de estos emails:');
        users.slice(0, 3).forEach((user) => {
            console.log(`   - ${user.email} (password que hayas puesto)`);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkLogin();
