const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');

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

function ensureLocalDatabase(url) {
    const host = url.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
        throw new Error(`Refusing restore: DATABASE_URL host is "${host}" (must be local)`);
    }
}

function pickBackupPath(repoRoot, argPath) {
    if (argPath) return path.resolve(argPath);

    const backupsDir = path.join(repoRoot, 'backups');
    const candidates = fs
        .readdirSync(backupsDir)
        .filter((f) => f.endsWith('.sql.gz'))
        .map((f) => ({
            file: path.join(backupsDir, f),
            mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime);

    if (!candidates.length) throw new Error('No backup .sql.gz files found in /backups');
    return candidates[0].file;
}

async function main() {
    const repoRoot = path.resolve(__dirname, '..');
    loadEnvFile(path.join(repoRoot, '.env'));

    const dbUrlRaw = process.env.DATABASE_URL;
    if (!dbUrlRaw) throw new Error('DATABASE_URL missing');

    const dbUrl = new URL(dbUrlRaw);
    ensureLocalDatabase(dbUrl);

    const backupPath = pickBackupPath(repoRoot, process.argv[2]);
    if (!fs.existsSync(backupPath)) throw new Error(`Backup not found: ${backupPath}`);

    const mysqlExe = 'C:\\xampp\\mysql\\bin\\mysql.exe';
    if (!fs.existsSync(mysqlExe)) throw new Error(`mysql.exe not found: ${mysqlExe}`);

    const dbName = dbUrl.pathname.replace(/^\//, '');
    const user = decodeURIComponent(dbUrl.username);
    const pass = decodeURIComponent(dbUrl.password);
    const port = Number(dbUrl.port || 3306);
    const host = dbUrl.hostname;

    console.log(`Restoring backup: ${backupPath}`);
    console.log(`Target DB: ${host}:${port}/${dbName}`);

    await new Promise((resolve, reject) => {
        const mysql = spawn(
            mysqlExe,
            ['-h', host, '-P', String(port), '-u', user, `-p${pass}`, dbName],
            { stdio: ['pipe', 'inherit', 'inherit'] }
        );

        const readStream = fs.createReadStream(backupPath);
        const gunzip = zlib.createGunzip();

        readStream.on('error', reject);
        gunzip.on('error', reject);
        mysql.on('error', reject);

        mysql.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`mysql exited with code ${code}`));
        });

        readStream.pipe(gunzip).pipe(mysql.stdin);
    });

    console.log('Restore completed successfully.');
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
