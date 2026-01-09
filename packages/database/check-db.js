const { prisma } = require('@freesquash/database');

async function checkDatabase() {
    try {
        console.log('🔍 Checking database schema...\n');

        // Check Users table
        console.log('📋 Users sample:');
        const users = await prisma.user.findMany({ take: 2 });
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('Sample user keys:', Object.keys(users[0]));
        }

        // Check Seasons
        console.log('\n📋 Seasons:');
        const seasons = await prisma.season.findMany();
        console.log('Seasons found:', seasons.length);
        console.log('Active season:', seasons.find(s => s.isActive)?.name || 'NONE');

        // Check Matches
        console.log('\n📋 Matches:');
        const matches = await prisma.match.findMany({ take: 3 });
        console.log('Matches found:', matches.length);
        if (matches.length > 0) {
            console.log('Sample match keys:', Object.keys(matches[0]));
            console.log('First match:', {
                id: matches[0].id,
                isScheduled: matches[0].isScheduled,
                scheduledDate: matches[0].scheduledDate,
                location: matches[0].location,
                gamesP1: matches[0].gamesP1,
                gamesP2: matches[0].gamesP2,
            });
        }

        // Check for missing fields
        console.log('\n✅ Schema validation:');
        if (matches.length > 0) {
            const match = matches[0];
            const requiredFields = ['isScheduled', 'scheduledDate', 'location', 'googleEventId', 'gamesP1', 'gamesP2'];
            const missingFields = requiredFields.filter(f => !(f in match));
            if (missingFields.length > 0) {
                console.error('❌ MISSING FIELDS:', missingFields);
            } else {
                console.log('✅ All calendar fields present in matches table');
            }
        }

        console.log('\n✅ Database check complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkDatabase();
