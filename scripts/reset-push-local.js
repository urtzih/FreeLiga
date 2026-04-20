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
        const value = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
        if (!process.env[key]) process.env[key] = value;
    }
}

async function main() {
    const repoRoot = path.resolve(__dirname, '..');
    loadEnvFile(path.join(repoRoot, '.env'));

    const dbUrlRaw = process.env.DATABASE_URL;
    if (!dbUrlRaw) throw new Error('DATABASE_URL is not set');

    const dbUrl = new URL(dbUrlRaw);
    const host = dbUrl.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
        throw new Error(`Refusing reset: DATABASE_URL host is "${host}" (not local)`);
    }

    const connection = await mysql.createConnection({
        host,
        port: Number(dbUrl.port || 3306),
        user: decodeURIComponent(dbUrl.username),
        password: decodeURIComponent(dbUrl.password),
        database: dbUrl.pathname.replace(/^\//, ''),
    });

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE `push_subscriptions`');
        await connection.query('TRUNCATE TABLE `public_push_subscriptions`');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Push subscription tables reset completed (local DB).');
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
