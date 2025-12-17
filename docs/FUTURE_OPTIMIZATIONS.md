# Optimizaciones Futuras Post-MVP

Este documento recoge las optimizaciones de base de datos y arquitectura que se implementarán cuando el sistema crezca en datos.

## Estado Actual (Diciembre 2025)

### ✅ Implementado
- Índices básicos en todas las tablas principales
- Índices compuestos en `matches` para queries frecuentes:
  - `[groupId, date]` - Partidos de un grupo ordenados por fecha
  - `[player1Id, date]` - Historial de partidos del jugador
  - `[player2Id, date]` - Historial de partidos del jugador
  - `[createdAt]` - Paginación de partidos recientes
- Tabla `PlayerSeasonStats` para estadísticas precalculadas por temporada
- Protección de datos históricos (no se pueden eliminar temporadas con datos)

### Proyección de Datos
- **Usuarios activos esperados:** 40-60 jugadores
- **Temporadas por año:** 6-10
- **Partidos por temporada:** ~400-500
- **Crecimiento anual:** ~3000-5000 partidos

## Optimizaciones Fase 2 (6-12 meses)

### Implementar cuando: Se alcancen 5,000 partidos o queries lentas (>500ms)

#### 1. Sistema de Caché con Redis

**Problema:** El Dashboard calcula estadísticas globales contando todos los partidos cada vez.

**Solución:**
```typescript
// Cachear estadísticas globales por 5 minutos
const cacheKey = `player:${playerId}:global-stats`;
let stats = await redis.get(cacheKey);

if (!stats) {
  stats = await calculateGlobalStats(playerId);
  await redis.setex(cacheKey, 300, JSON.stringify(stats));
}
```

**Datos a cachear:**
- Estadísticas globales de jugadores (Dashboard)
- Clasificaciones de grupos (se invalidan solo al registrar partido)
- Lista de temporadas activas/inactivas
- Propuestas de cierre (cambian poco)

**Estimación de impacto:**
- Reducción de carga DB: 60-70%
- Mejora de latencia Dashboard: 200ms → 20ms

#### 2. Uso de PlayerSeasonStats

**Migrar queries de:**
```typescript
// ANTES: Contar partidos cada vez
const matches = await prisma.match.findMany({
  where: {
    OR: [{ player1Id }, { player2Id }],
    group: { seasonId }
  }
});
const wins = matches.filter(m => m.winnerId === playerId).length;
```

**A:**
```typescript
// DESPUÉS: Leer stats precalculadas
const stats = await prisma.playerSeasonStats.findUnique({
  where: { playerId_seasonId: { playerId, seasonId } }
});
const wins = stats.wins;
```

**Actualización automática:**
```typescript
// Hook after Match.create/update/delete
async function updatePlayerSeasonStats(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { group: true }
  });
  
  // Recalcular stats para ambos jugadores en esa temporada
  await recalculateStats(match.player1Id, match.group.seasonId);
  await recalculateStats(match.player2Id, match.group.seasonId);
}
```

#### 3. Paginación en Historial de Partidos

**Implementar cursor-based pagination:**
```typescript
// En lugar de cargar todos los partidos
const matches = await prisma.match.findMany({
  where: { /* filters */ },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { date: 'desc' }
});

// Usar cursor pagination
const matches = await prisma.match.findMany({
  where: { /* filters */ },
  take: 20,
  cursor: lastMatchId ? { id: lastMatchId } : undefined,
  orderBy: { createdAt: 'desc' }
});
```

**Beneficio:** Queries más rápidas incluso con 50k+ partidos.

## Optimizaciones Fase 3 (2-3 años)

### Implementar cuando: Se alcancen 20,000 partidos o 5+ años de historial

#### 1. Particionamiento de Tabla `matches`

**Objetivo:** Mejorar performance de queries históricas dividing tabla por años.

**Implementación en MySQL:**
```sql
ALTER TABLE matches PARTITION BY RANGE (YEAR(date)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p2027 VALUES LESS THAN (2028),
    PARTITION p2028 VALUES LESS THAN (2029),
    PARTITION p2029 VALUES LESS THAN (2030),
    PARTITION pFuture VALUES LESS THAN MAXVALUE
);
```

**Beneficios:**
- Queries de temporada actual solo escanean partición del año
- Eliminación de datos antiguos más eficiente (si se necesita)
- Backup incremental por año

**Consideraciones:**
- Requiere `date` en la clave primaria o única
- No se puede usar con foreign keys en algunas versiones MySQL
- Evaluar alternativa: Tabla `matches_archive` separada

#### 2. Archivo de Temporadas Antiguas

**Schema adicional:**
```prisma
model ArchivedSeason {
  id            String   @id @default(cuid())
  seasonId      String   @unique
  seasonName    String
  seasonData    Json     // Snapshot completo serializado
  matchCount    Int
  playerCount   Int
  groupCount    Int
  finalStandings Json   // Clasificaciones finales
  archivedAt    DateTime @default(now())
  archivedBy    String?  // Admin que archivó

  @@index([archivedAt])
  @@map("archived_seasons")
}
```

**Proceso de archivo:**
1. Temporadas con >2 años de antigüedad se marcan para archivo
2. Admin ejecuta script que:
   - Serializa toda la información de la temporada a JSON
   - Genera CSVs de respaldo
   - Guarda snapshot en `ArchivedSeason`
   - Mantiene datos originales pero los marca como `archived: true`
3. UI muestra temporadas archivadas en modo "solo lectura" desde JSON

**Beneficio:** 
- Base de datos activa solo tiene 2-3 años de datos "calientes"
- Datos históricos accesibles pero no degradan performance

#### 3. Read Replicas para Analytics

**Cuando:** Múltiples admins consultando reportes simultáneamente

**Arquitectura:**
```
┌─────────────┐
│ Master DB   │ ← Escrituras (registrar partidos, crear usuarios)
└──────┬──────┘
       │ Replicación
       ▼
┌─────────────┐
│ Replica DB  │ ← Lecturas (dashboards, estadísticas, reportes)
└─────────────┘
```

**Configuración Prisma:**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Master
    }
  }
});

const prismaReadOnly = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL // Replica
    }
  }
});
```

#### 4. Agregaciones Materializadas

**Views de MySQL para consultas complejas frecuentes:**

```sql
-- Vista materializada de clasificación actual por grupo
CREATE TABLE group_standings AS
SELECT 
  gp.groupId,
  gp.playerId,
  p.name,
  COUNT(CASE WHEN m.winnerId = gp.playerId THEN 1 END) as wins,
  COUNT(CASE WHEN m.winnerId != gp.playerId AND m.winnerId IS NOT NULL THEN 1 END) as losses,
  SUM(CASE WHEN m.player1Id = gp.playerId THEN m.gamesP1 
           WHEN m.player2Id = gp.playerId THEN m.gamesP2 END) as setsWon,
  SUM(CASE WHEN m.player1Id = gp.playerId THEN m.gamesP2 
           WHEN m.player2Id = gp.playerId THEN m.gamesP1 END) as setsLost
FROM group_players gp
JOIN players p ON p.id = gp.playerId
LEFT JOIN matches m ON m.groupId = gp.groupId 
  AND (m.player1Id = gp.playerId OR m.player2Id = gp.playerId)
GROUP BY gp.groupId, gp.playerId, p.name;

-- Índices en la vista
CREATE INDEX idx_group_standings_group ON group_standings(groupId);
CREATE INDEX idx_group_standings_player ON group_standings(playerId);
```

**Actualización:** Trigger o cron job que regenera la vista cada X minutos o cuando hay cambios.

## Monitorización y Métricas

### KPIs a Vigilar

**Performance:**
- Tiempo de respuesta Dashboard: <200ms (objetivo: <100ms)
- Tiempo carga clasificación: <300ms
- Tiempo registro de partido: <500ms

**Volumen de Datos:**
- Número total de partidos
- Partidos por temporada (tendencia)
- Tamaño de tabla `matches` en MB
- Queries más lentas (usar `EXPLAIN ANALYZE`)

### Herramientas de Monitorización

**Inmediato:**
```typescript
// Middleware de logging en Fastify
fastify.addHook('onResponse', (request, reply, done) => {
  const responseTime = reply.getResponseTime();
  if (responseTime > 1000) {
    logger.warn({
      url: request.url,
      method: request.method,
      responseTime: `${responseTime}ms`,
      message: 'Slow query detected'
    });
  }
  done();
});
```

**Fase 2:**
- Prometheus + Grafana para métricas
- Slow Query Log de MySQL habilitado
- New Relic o Datadog para APM

## Plan de Migración

### Checklist para Cada Optimización

- [ ] Hacer backup completo de producción
- [ ] Probar en entorno de desarrollo con datos reales (copia sanitizada)
- [ ] Medir performance ANTES de la optimización (baseline)
- [ ] Implementar cambio
- [ ] Medir performance DESPUÉS (validar mejora)
- [ ] Monitorizar durante 1 semana
- [ ] Documentar resultados

### Rollback Plan

Cada optimización debe tener plan de rollback documentado:
- Índices: se pueden eliminar sin afectar datos
- Nueva tabla stats: se puede vaciar y recalcular
- Particionamiento: requiere restaurar backup
- Caché: simplemente apagar Redis no rompe nada

## Notas Técnicas

### Limitaciones MySQL 8.0

- Particionamiento no soporta foreign keys en InnoDB hasta MySQL 8.0.13+
- Máximo 8192 particiones por tabla
- `PARTITION BY RANGE` requiere columna en primary key

### Alternativas Consideradas

**PostgreSQL vs MySQL:**
- PostgreSQL tiene mejor soporte de particionamiento
- MySQL es más simple para el equipo actual
- Mantener MySQL por ahora, revisar en Fase 3

**MongoDB para stats:**
- Considerado para `PlayerSeasonStats` como documento JSON
- Descartado por complejidad de mantener dos bases de datos
- SQL funciona bien para este volumen de datos

## Responsables

- **Fase 2 (6-12 meses):** Equipo de desarrollo actual
- **Fase 3 (2-3 años):** Probablemente requiere DBA especializado o consultoría

## Referencias

- Prisma Performance Best Practices: https://www.prisma.io/docs/guides/performance-and-optimization
- MySQL Partitioning: https://dev.mysql.com/doc/refman/8.0/en/partitioning.html
- Índices Compuestos: https://use-the-index-luke.com/

---

**Última actualización:** Diciembre 2025  
**Próxima revisión:** Junio 2026 (o al alcanzar 5,000 partidos)
