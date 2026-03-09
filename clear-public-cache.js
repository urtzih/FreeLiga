require('dotenv').config();

async function clearPublicCache() {
    try {
        console.log('\n🔄 LIMPIANDO CACHÉ PÚBLICO\n');
        console.log('═'.repeat(60));

        const token = process.env.CACHE_INVALIDATE_TOKEN || 'dev-token';
        const apiUrl = process.env.API_URL || 'http://localhost:4000';

        console.log(`\n📡 Servidor: ${apiUrl}`);
        console.log(`🔑 Token: ${token.substring(0, 8)}...`);

        const response = await fetch(`${apiUrl}/api/public/cache/invalidate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cache-token': token
            }
        });

        if (!response.ok) {
            console.error(`\n❌ Error: ${response.status} ${response.statusText}`);
            const errorData = await response.text();
            console.error(errorData);
            return;
        }

        const data = await response.json();
        
        console.log('\n✅ Caché público limpiado exitosamente');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n═'.repeat(60));
        console.log('\n💡 RECOMENDACIONES:\n');
        console.log('1. Refresca la página en el navegador (Ctrl+F5 o Cmd+Shift+R)');
        console.log('2. Si persiste el problema, limpia el caché del navegador');
        console.log('3. Verifica que la temporada correcta esté activa\n');

    } catch (error) {
        console.error('\n❌ Error al limpiar el caché:');
        console.error(error.message);
        console.log('\n💡 Asegúrate de que el servidor API esté corriendo (npm run dev)\n');
    }
}

clearPublicCache();
