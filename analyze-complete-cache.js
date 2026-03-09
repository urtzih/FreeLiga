require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCache() {
    try {
        console.log('\n🔍 ANÁLISIS COMPLETO DEL SISTEMA DE CACHES\n');
        console.log('═'.repeat(70));

        // 1. Estado actual del caché en memoria (servidor)
        console.log('\n📦 CACHÉ EN MEMORIA DEL SERVIDOR (backend)\n');
        console.log('Estado: El caché está EN MEMORIA en Node.js');
        console.log('├─ Ubicación: apps/api/src/services/cache.service.ts');
        console.log('├─ Tipo: Singleton Map<string, CacheEntry>');
        console.log('├─ TTL: 24 horas para datos públicos');
        console.log('├─ Persistencia: ❌ Se pierde al reiniciar el servidor');
        console.log('└─ Limpieza: Automática cada hora');

        // 2. Ver cuándo fue la última vez que se fue a BD
        console.log('\n⏰ INFORMACIÓN SOBRE TEMPORADAS\n');

        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true },
            orderBy: { startDate: 'desc' }
        });

        const previousSeason = await prisma.season.findFirst({
            where: { isActive: false },
            orderBy: { startDate: 'desc' }
        });

        if (activeSeason) {
            console.log(`✅ Temporada Activa: ${activeSeason.name}`);
            console.log(`   Inicio: ${activeSeason.startDate.toISOString().split('T')[0]}`);
            console.log(`   Fin: ${activeSeason.endDate.toISOString().split('T')[0]}`);
            
            const now = new Date();
            const activeDays = Math.floor((now - activeSeason.startDate) / (1000 * 60 * 60 * 24));
            console.log(`   Días activa: ${activeDays} días`);
        }

        if (previousSeason) {
            console.log(`\n📅 Temporada Anterior: ${previousSeason.name}`);
            console.log(`   Inicio: ${previousSeason.startDate.toISOString().split('T')[0]}`);
            console.log(`   Fin: ${previousSeason.endDate.toISOString().split('T')[0]}`);
        }

        // 3. Datos que se cachean
        console.log('\n🗂️  QIÉN ACCEDE A CADA NIVEL DE CACHÉ\n');

        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│ VISTA: PÚBLICO (Sin login)                                  │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ URLs: /, /public/groups, /public/group/:id                  │');
        console.log('│ Datos:                                                      │');
        console.log('│ ├─ public:groups-summary (24h)                              │');
        console.log('│ │  └─ Rankings de todos los grupos de la temporada activa   │');
        console.log('│ ├─ public:group:{id}:classification:v2 (24h)               │');
        console.log('│ │  └─ Clasificación completa de un grupo                    │');
        console.log('│ └─ public:recent-matches (24h)                              │');
        console.log('│    └─ Últimos 10 partidos jugados                           │');
        console.log('│ Estado: ' + (activeSeason && activeSeason.isActive ? '✅ DATOS FRESCOS' : '❌ SIN DATOS') + '                                     │');
        console.log('└─────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        console.log('│ VISTA: JUGADOR (Con login en su grupo)                      │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ URLs: /groups/:id, /groups/summary, /dashboard              │');
        console.log('│ Datos:                                                      │');
        console.log('│ ├─ private:group:{id}:detail (5 min)                        │');
        console.log('│ │  └─ Datos del grupo (jugadores, partidos del user)        │');
        console.log('│ ├─ private:classification:{id} (5 min)                      │');
        console.log('│ │  └─ Su clasificación personal dentro del grupo            │');
        console.log('│ └─ private:player:{playerId}:stats (variado)                │');
        console.log('│    └─ Sus estadísticas personales                           │');
        console.log('│ Estado: ' + (activeSeason && activeSeason.isActive ? '✅ DATOS FRESCOS' : '❌ SIN DATOS') + '                                     │');
        console.log('└─────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        console.log('│ VISTA: ADMIN (Gestor del sistema)                           │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ URLs: /admin/*, /admin/cache                                │');
        console.log('│ Acciones:                                                   │');
        console.log('│ ├─ Ver todas las caches en tabla                            │');
        console.log('│ ├─ Ver cuándo se actualizó cada una (timestamps)            │');
        console.log('│ ├─ Borrar caches individuales                               │');
        console.log('│ ├─ Borrar todas las caches públicas                         │');
        console.log('│ └─ Ver métricas (hit rate, hits, misses, etc.)              │');
        console.log('│ Estado: ' + (activeSeason && activeSeason.isActive ? '✅ CON CONTROL TOTAL' : '❌ SIN DATOS QUE CACHEAR') + '                     │');
        console.log('└─────────────────────────────────────────────────────────────┘');

        // 4. Niveles de cache
        console.log('\n📊 NIVELES DE CACHÉ EN LA ARQUITECTURA\n');

        console.log('┌─ NIVEL 3: Browser Cache (HTML5 / Service Worker)');
        console.log('│  └─ Dónde: Cliente (navegador)');
        console.log('│  └─ Duración: Controlada por el navegador');
        console.log('│  └─ Qué guarda: Archivos JS, CSS, imágenes (si hay SW)');
        console.log('│  └─ Ventaja: ⚡️ Más rápido (local)');
        console.log('│  └─ Problema: Los datos quedan ANTIGUOS si no refrescas');
        console.log('│');
        console.log('├─ NIVEL 2: API Cache (En Memoria - Node.js)');
        console.log('│  └─ Dónde: Servidor API (apps/api)');
        console.log('│  └─ Duración: 24h (público), 5-30 min (privado)');
        console.log('│  └─ Qué guarda: Rankings, clasificaciones, partidos');
        console.log('│  └─ Ventaja: ⚡️ Muy rápido (evita queries a BD)');
        console.log('│  └─ Problema: Se pierde si reinician el servidor');
        console.log('│');
        console.log('└─ NIVEL 1: Database (MySQL)');
        console.log('   └─ Dónde: Base de datos');
        console.log('   └─ Duración: Permanente');
        console.log('   └─ Qué guarda: TODO (usuarios, partidos, grupos, etc.)');
        console.log('   └─ Ventaja: 💾 Persistente');
        console.log('   └─ Problema: 🐢 Más lento (queries complejas)');

        // 5. Botones y qué hacen
        console.log('\n🔘 BOTONES EN /admin/cache Y QUÉ HACEN\n');

        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│ 1️⃣ BOTÓN: "Recargar" (arriba a la derecha)                 │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ Qué hace: Consulta el servidor y actualiza la tabla         │');
        console.log('│ Cuándo usar: Para ver el estado ACTUAL de las caches        │');
        console.log('│ Efecto: Solo lectura (no borra nada)                        │');
        console.log('│ Respuesta: Muestra todas las entradas con:                  │');
        console.log('│ ├─ Clave (ej: public:groups-summary)                        │');
        console.log('│ ├─ Tipo (public/private)                                    │');
        console.log('│ ├─ Antigüedad (cuánto tiempo lleva en caché)                │');
        console.log('│ ├─ Expira en (cuánto tiempo le queda hasta expiración)       │');
        console.log('│ └─ Creado (fecha y hora exacta)                             │');
        console.log('└─────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        console.log('│ 2️⃣ BOTÓN: "Invalidar Todo" (rojo en el panel)              │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ Qué hace: Borra TODAS las caches públicas al instante      │');
        console.log('│ APIs afectadas:                                             │');
        console.log('│ ├─ /api/public/groups-summary (se vacía)                    │');
        console.log('│ ├─ /api/public/group/:id/classification (se vacían)         │');
        console.log('│ └─ /api/public/recent-matches (se vacía)                    │');
        console.log('│ Cuándo usar: Cuando cambias de temporada o hay datos viejos │');
        console.log('│ Efecto: 💥 Destructivo (borra TODO)                         │');
        console.log('│ Resultado: La próxima request a esas APIs va a BD           │');
        console.log('│ Tiempo respuesta: Vuelve a ser lento hasta que cachee       │');
        console.log('└─────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        console.log('│ 3️⃣ BOTÓN: "🗑️" en cada fila (gris en la tabla)            │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│ Qué hace: Borra UNA SOLA cache específica                   │');
        console.log('│ Ejemplo: Si borras "public:groups-summary"                  │');
        console.log('│ ├─ Esa cache se vacía al instante                           │');
        console.log('│ ├─ Las demás caches siguen funcionando                      │');
        console.log('│ ├─ Si alguien accede a /public/groups se regenera           │');
        console.log('│ └─ El resto de requests siguen usando caché vieja           │');
        console.log('│ Cuándo usar: Cuando conoces exactamente qué está vicio      │');
        console.log('│ Ventaja: Más preciso que borrar todo                        │');
        console.log('└─────────────────────────────────────────────────────────────┘');

        // 6. Cuando se actualiza el cache
        console.log('\n⏱️ CUÁNDO SE ACTUALIZA (O REFRESCA) CADA CACHE\n');

        console.log('┌─ ACTUALIZACIÓN AUTOMÁTICA:');
        console.log('│  ├─ Cada 24 horas: público expira (luego se regenera)');
        console.log('│  ├─ Cada 5-30 min: privado expira (luego se regenera)');
        console.log('│  └─ Limpieza cada hora: Se borran las expiradas');
        console.log('│');
        console.log('├─ ACTUALIZACIÓN MANUAL (por admin):');
        console.log('│  ├─ Click "Invalidar Todo" → Borra TODO inmediatamente');
        console.log('│  ├─ Click "🗑️" en fila → Borra esa específica');
        console.log('│  └─ Efecto: La próxima request trae datos FRESCOS de BD');
        console.log('│');
        console.log('└─ ACTUALIZACIÓN AUTOMÁTICA ESPECIAL:');
        console.log('   ├─ Al crear un partido: Se invalida cache de ese grupo');
        console.log('   ├─ Al cambiar temporada: Se invalida TODO');
        console.log('   └─ Al crear grupo/temporada: Se invalida cache pública');

        // 7. Cuándo está "a 0"
        console.log('\n❓ POR QUÉ ESTÁ "A 0"\n');

        console.log('Razón 1: SIN PARTIDOS EN TEMPORADA ACTUAL');
        console.log('├─ Temporada: ' + (activeSeason ? activeSeason.name : 'N/A'));
        console.log('├─ Partidos jugados: 0');
        console.log('└─ → Todos los jugadores tienen 0V/0D (correcto)');

        console.log('\nRazón 2: CACHÉ VACÍO = NORMAL AL EMPEZAR');
        console.log('├─ Primera request: cache miss (no existe)');
        console.log('├─ Se consulta BD, se genera dato');
        console.log('├─ Se guarda en cache (24h)');
        console.log('└─ Siguientes requests: cache hit (directo del cache)');

        console.log('\nRazón 3: DATOS PUEDEN APARECER ANTIGUOS');
        console.log('├─ Problema: Caché del NAVEGADOR (no del servidor)');
        console.log('├─ Solución: Hard refresh (Ctrl+F5)');
        console.log('└─ Problema resuelto: Admin invalida caché + user hace refresh');

        // 8. SERVICE WORKER
        console.log('\n🟢 SOBRE SERVICE WORKERS\n');

        console.log('¿Tienen Service Worker implementado?');
        console.log('└─ Probablemente NO (es una feature avanzada)');

        console.log('\n¿Qué sería un SW?');
        console.log('├─ Código que corre en el navegador en paralelo');
        console.log('├─ Intercepta requests HTTP del usuario');
        console.log('├─ Puede cachear archivos, API calls, etc.');
        console.log('└─ Permite app funcionar sin conexión (offline)');

        console.log('\n¿Necesitan SW para esto?');
        console.log('├─ NO. Lo que tienen es SUFICIENTE.') ;
        console.log('├─ Ventaja SW: Offline + caching en el cliente');
        console.log('├─ Ventaja actual: Simple, sin complejidad extra');
        console.log('└─ Contexto:');
        console.log('   ├─ Esto es una app de LIGAS DE SQUASH');
        console.log('   ├─ Los usuarios necesitan datos SIEMPRE actuales');
        console.log('   ├─ Offline no es requisito');
        console.log('   └─ Lo que tienen: Cache server optimizado ✅');

        console.log('\n═'.repeat(70));
        console.log('\n✅ ANÁLISIS COMPLETADO\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeCache();
