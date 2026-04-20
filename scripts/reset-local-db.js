const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
        const idx = line.indexOf('=');
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
    }
}

async function main() {
    const repoRoot = path.resolve(__dirname, '..');
    loadEnvFile(path.join(repoRoot, '.env'));

    const dbUrlRaw = process.env.DATABASE_URL;
    if (!dbUrlRaw) {
        throw new Error('DATABASE_URL is not set. Aborting reset.');
    }

    const dbUrl = new URL(dbUrlRaw);
    const host = dbUrl.hostname;
    const dbName = dbUrl.pathname.replace(/^\//, '');
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    if (!isLocalHost) {
        throw new Error(`Refusing reset: DATABASE_URL host is "${host}" (not local).`);
    }

    const connection = await mysql.createConnection({
        host,
        port: Number(dbUrl.port || 3306),
        user: decodeURIComponent(dbUrl.username),
        password: decodeURIComponent(dbUrl.password),
        database: dbName,
    });

    try {
        const [rows] = await connection.query(
            `
            SELECT TABLE_NAME AS tableName
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ?
              AND TABLE_TYPE = 'BASE TABLE'
              AND TABLE_NAME <> '_prisma_migrations'
            ORDER BY TABLE_NAME ASC
            `,
            [dbName]
        );

        const tables = rows.map((r) => r.tableName);
        if (tables.length === 0) {
            console.log('No tables found to truncate.');
            return;
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE \`${table}\``);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log(`Database reset completed on "${dbName}".`);
        console.log(`Truncated tables: ${tables.length}`);
        for (const table of tables) {
            console.log(`- ${table}`);
        }
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
