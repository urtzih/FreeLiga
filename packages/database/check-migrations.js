const { prisma } = require('@freesquash/database');

async function checkMigrations() {
    try {
        console.log('🔍 Checking applied migrations in Railway...\n');

        // Raw query to check _prisma_migrations table
        const result = await prisma.$queryRaw`
            SELECT id, checksum, finished_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 15;
        `;

        console.log('Applied migrations:');
        result.forEach(m => {
            console.log(`  ✅ ${m.id} (${m.finished_at ? 'DONE' : 'PENDING'})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkMigrations();
