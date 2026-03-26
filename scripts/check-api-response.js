require('dotenv').config();

async function checkApiAndCache() {
    try {
        console.log('\n🔍 VERIFICANDO RESPUESTA DEL API\n');
        console.log('═'.repeat(60));

        // Hacer request al endpoint público
        const response = await fetch('http://localhost:4000/api/public/groups-summary');
        const data = await response.json();

        console.log(`\n📊 Temporada: ${data.seasonName}`);
        console.log(`   Cached: ${data.cached}`);
        console.log(`   Updated: ${data.updatedAt}`);
        console.log(`\n   Total grupos: ${data.groups.length}`);

        console.log('\n📈 Resumen de grupos:');
        console.log('─'.repeat(60));

        data.groups.forEach((group, idx) => {
            console.log(`\n${idx + 1}. ${group.name} (ID: ${group.id.substring(0, 15)}...)`);
            console.log(`   Jugadores: ${group.playerCount}`);
            console.log(`   Partidos: ${group.matchCount}`);
            
            if (group.rankings && group.rankings.length > 0) {
                console.log('   Top 3 jugadores:');
                group.rankings.slice(0, 3).forEach((player, pidx) => {
                    console.log(`      ${pidx + 1}. ${player.name} - ${player.won}V/${player.lost}D (${player.played} partidos)`);
                });
            }

            if (group.matchCount > 0) {
                console.log('   ⚠️  GRUPO CON PARTIDOS (pero temporada actual no tiene partidos)');
            }
        });

        console.log('\n═'.repeat(60));
        console.log('\n✅ Verificación completada\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkApiAndCache();
