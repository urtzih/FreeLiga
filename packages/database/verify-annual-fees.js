#!/usr/bin/env node

/**
 * Script de verificación: Cuotas Anuales de Club
 * Verifica que el campo annualFeesPaid existe en la BD
 */

const mysql = require('mysql2/promise');

async function verifyAnnualFeesImplementation() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'rootpassword',
        database: 'railway'
    });

    console.log('\n🔍 Verificando implementación de Cuotas Anuales...\n');

    try {
        // 1. Verificar que la tabla existe
        const [tables] = await connection.query(`
            SELECT TABLE_NAME FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'players'
        `);

        if (tables.length === 0) {
            console.log('❌ Tabla "players" no encontrada');
            return;
        }
        console.log('✓ Tabla "players" existe');

        // 2. Verificar que la columna existe
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'players' AND COLUMN_NAME = 'annualFeesPaid'
        `);

        if (columns.length === 0) {
            console.log('❌ Columna "annualFeesPaid" no encontrada');
            return;
        }

        const column = columns[0];
        console.log('✓ Columna "annualFeesPaid" existe');
        console.log(`  Tipo: ${column.COLUMN_TYPE}`);

        // 3. Mostrar ejemplos de datos
        const [samples] = await connection.query(`
            SELECT id, name, annualFeesPaid 
            FROM players 
            WHERE annualFeesPaid IS NOT NULL AND annualFeesPaid != '[]' 
            LIMIT 5
        `);

        if (samples.length > 0) {
            console.log('\n📊 Ejemplos de datos:');
            samples.forEach((sample) => {
                const fees = typeof sample.annualFeesPaid === 'string' 
                    ? JSON.parse(sample.annualFeesPaid) 
                    : sample.annualFeesPaid;
                console.log(`  ${sample.name}: ${JSON.stringify(fees)}`);
            });
        } else {
            console.log('\n⚠️  No hay jugadores con cuotas registradas (esperado en BD vacía)');
        }

        // 4. Mostrar estadísticos
        const [stats] = await connection.query(`
            SELECT 
                COUNT(*) as total_players,
                SUM(CASE WHEN annualFeesPaid != '[]' THEN 1 ELSE 0 END) as with_fees,
                SUM(CASE WHEN annualFeesPaid = '[]' THEN 1 ELSE 0 END) as without_fees
            FROM players
        `);

        console.log('\n📈 Estadísticos:');
        console.log(`  Total jugadores: ${stats[0].total_players}`);
        console.log(`  Con cuotas: ${stats[0].with_fees || 0}`);
        console.log(`  Sin cuotas: ${stats[0].without_fees || 0}`);

        console.log('\n✅ Verificación completada exitosamente');

    } catch (error) {
        console.error('\n❌ Error durante la verificación:');
        console.error(error);
    } finally {
        await connection.end();
    }
}

verifyAnnualFeesImplementation();

