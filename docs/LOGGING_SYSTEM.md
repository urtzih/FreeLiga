# Sistema de Logs Estructurados - FreeSquash

## 📋 Descripción General

Este proyecto utiliza un sistema de logging estructurado basado en **Pino** que permite:

- ✅ **Logs en formato JSON** para análisis programático
- ✅ **Rotación automática** de archivos de log
- ✅ **Contexto enriquecido** (userId, requestId, duración, etc.)
- ✅ **Herramientas de análisis** para extraer estadísticas
- ✅ **Visualización** de métricas y eventos

## 🏗️ Arquitectura

### Estructura de Logs

Los logs se almacenan en formato JSON con la siguiente estructura:

```json
{
  "level": 30,
  "time": "2025-12-18T10:30:45.123Z",
  "app": "freesquash-api",
  "env": "production",
  "msg": "Match created successfully",
  "type": "business_event",
  "event": "match_created",
  "matchId": "abc123",
  "groupId": "def456",
  "userId": 42
}
```

### Niveles de Log

- `10` - **TRACE**: Información muy detallada para debugging
- `20` - **DEBUG**: Información de depuración
- `30` - **INFO**: Información general (por defecto)
- `40` - **WARN**: Advertencias
- `50` - **ERROR**: Errores manejados
- `60` - **FATAL**: Errores críticos que requieren atención inmediata

### Tipos de Logs

1. **business_event**: Eventos de negocio importantes
2. **http_request**: Peticiones HTTP
3. **error**: Errores y excepciones
4. **metric**: Métricas y estadísticas
5. **operation**: Operaciones con duración

## 🔧 Configuración

### Variables de Entorno

```bash
# Nivel de logging (trace, debug, info, warn, error, fatal)
LOG_LEVEL=info

# Entorno
NODE_ENV=production
```

### Almacenamiento

Los logs se guardan en `apps/api/logs/`:

- `app.log` - Logs generales (rotación diaria, mantiene 30 días)
- `error.log` - Solo errores (rotación diaria, mantiene 90 días)
- `app.log.1.gz` - Archivos antiguos comprimidos

## 📝 Uso en el Código

### Logger Básico

```typescript
import { logger } from './utils/logger';

// Log simple
logger.info('Server started successfully');

// Log con contexto
logger.info({ userId: 123, action: 'login' }, 'User logged in');

// Log de error
logger.error({ error, userId: 123 }, 'Failed to process request');
```

### Child Logger (Contexto Persistente)

```typescript
import { createChildLogger } from './utils/logger';

const requestLogger = createChildLogger({ 
  requestId: req.id, 
  userId: req.user.id 
});

requestLogger.info('Processing request');
requestLogger.info({ data: result }, 'Request completed');
```

### Helpers Especializados

#### Eventos de Negocio

```typescript
import { logBusinessEvent } from './utils/logger';

logBusinessEvent('match_created', {
  matchId: match.id,
  player1: 'John Doe',
  player2: 'Jane Smith',
  score: '3-1',
});
```

#### Operaciones con Duración

```typescript
import { logOperation } from './utils/logger';

const result = await logOperation(
  'calculate_rankings',
  async () => {
    // Tu código aquí
    return await calculateGroupRankings(groupId);
  },
  { groupId }
);
// Automáticamente logea inicio, fin, duración y errores
```

#### Errores

```typescript
import { logError } from './utils/logger';

try {
  // código
} catch (error) {
  logError(error, { 
    operation: 'update_match',
    matchId: id 
  });
}
```

#### Métricas

```typescript
import { logMetric } from './utils/logger';

logMetric('active_users', 150, 'count', { 
  type: 'concurrent' 
});

logMetric('response_time', 245, 'ms', { 
  endpoint: '/api/matches' 
});
```

## 📊 Análisis de Logs

### Herramienta de Análisis

Incluye un script de análisis potente:

```bash
# Ver todos los comandos disponibles
tsx src/scripts/analyze-logs.ts

# Estadísticas de eventos de negocio
tsx src/scripts/analyze-logs.ts events

# Análisis de errores
tsx src/scripts/analyze-logs.ts errors

# Métricas de performance
tsx src/scripts/analyze-logs.ts performance

# Actividad por usuario
tsx src/scripts/analyze-logs.ts users

# Timeline de actividad
tsx src/scripts/analyze-logs.ts timeline

# Consultas personalizadas
tsx src/scripts/analyze-logs.ts query --type business_event --limit 50
tsx src/scripts/analyze-logs.ts query --level error --limit 100
```

### Ejemplos de Salida

#### Eventos de Negocio

```json
{
  "match_created": {
    "count": 145,
    "examples": [...]
  },
  "match_updated": {
    "count": 52,
    "examples": [...]
  },
  "server_started": {
    "count": 3,
    "examples": [...]
  }
}
```

#### Análisis de Errores

```json
{
  "ValidationError": {
    "count": 23,
    "lastSeen": "2025-12-18T14:30:00.000Z",
    "examples": [...]
  }
}
```

#### Métricas de Performance

```json
{
  "calculate_rankings": {
    "count": 145,
    "avg": 245,
    "min": 120,
    "max": 1200,
    "p50": 230,
    "p95": 450,
    "p99": 800
  }
}
```

## 🔍 Consultas Avanzadas

### Usando jq (Linux/Mac/WSL)

```bash
# Contar eventos por tipo
cat logs/app.log | jq -r '.type' | sort | uniq -c

# Errores de las últimas 24 horas
cat logs/app.log | jq 'select(.level >= 50)'

# Top usuarios más activos
cat logs/app.log | jq 'select(.userId) | .userId' | sort | uniq -c | sort -rn

# Duración promedio por operación
cat logs/app.log | jq 'select(.duration) | [.operation, .duration]'

# Eventos de un usuario específico
cat logs/app.log | jq 'select(.userId == 42)'
```

### Programáticamente (Node.js)

```typescript
import { LogAnalyzer } from './scripts/analyze-logs';

const analyzer = new LogAnalyzer();

// Consulta personalizada
const results = await analyzer.query({
  level: 'error',
  startDate: '2025-12-01',
  endDate: '2025-12-18',
  userId: 42,
  limit: 100
});

// Estadísticas de eventos
const eventStats = await analyzer.businessEventStats();

// Performance de operaciones
const perfMetrics = await analyzer.performanceMetrics();
```

## 📈 Dashboard y Visualización

### Opción 1: Grafana + Loki (Recomendado para Producción)

1. Instalar Grafana Loki para agregación de logs
2. Configurar datasource apuntando a los archivos de log
3. Crear dashboards con:
   - Gráficas de eventos por tiempo
   - Top errores
   - Performance de operaciones
   - Actividad de usuarios

### Opción 2: ELK Stack (Elasticsearch, Logstash, Kibana)

1. Configurar Logstash para leer los logs JSON
2. Indexar en Elasticsearch
3. Crear visualizaciones en Kibana

### Opción 3: Análisis Local con Scripts

Ver ejemplos de análisis con el script incluido arriba.

## 🎯 Mejores Prácticas

### 1. Logging Consistente

```typescript
// ✅ BIEN - Incluye contexto útil
logger.info({ 
  matchId, 
  userId, 
  duration: Date.now() - startTime 
}, 'Match updated successfully');

// ❌ MAL - Muy genérico
logger.info('Update complete');
```

### 2. No Loguear Información Sensible

```typescript
// ✅ BIEN - Password redactado automáticamente
logger.info({ email, role }, 'User created');

// ❌ MAL - Expone password
logger.info({ email, password, role }, 'User created');
```

### 3. Niveles Apropiados

```typescript
logger.trace('Entering function'); // Solo desarrollo
logger.debug('Variable value:', value); // Debugging
logger.info('User logged in'); // Información general
logger.warn('Deprecated API used'); // Advertencias
logger.error({ error }, 'Failed to save'); // Errores
logger.fatal('Database connection lost'); // Crítico
```

### 4. Eventos de Negocio Significativos

Loguea eventos importantes del negocio:

- Usuario registrado/login
- Partido creado/actualizado/eliminado
- Cambios en rankings
- Promociones/descensos
- Errores de negocio (partidos duplicados, validaciones)

### 5. Métricas de Performance

Para operaciones importantes:

```typescript
const result = await logOperation('expensive_operation', 
  async () => {
    return await doSomethingExpensive();
  },
  { context: 'important' }
);
```

## 🔒 Seguridad

Los siguientes campos se redactan automáticamente:

- `password`
- `token`
- `accessToken`
- `req.headers.authorization`

## 📦 Rotación y Mantenimiento

- **Logs generales**: 30 días
- **Logs de errores**: 90 días
- **Compresión**: Archivos antiguos se comprimen con gzip
- **Rotación**: Diaria a medianoche

### Limpieza Manual

```bash
# Eliminar logs antiguos (Linux/Mac)
find logs/ -name "*.gz" -mtime +90 -delete

# Windows PowerShell
Get-ChildItem logs\*.gz | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-90)} | Remove-Item
```

## 🚀 Próximas Mejoras

- [ ] Dashboard web integrado
- [ ] Alertas automáticas por email/Slack
- [ ] Exportación a servicios cloud (CloudWatch, Datadog)
- [ ] Agregación de métricas en tiempo real
- [ ] API REST para consultas de logs

## 📚 Referencias

- [Pino Documentation](https://getpino.io/)
- [Fastify Logging](https://www.fastify.io/docs/latest/Reference/Logging/)
- [Best Practices for Structured Logging](https://www.loggly.com/ultimate-guide/node-logging-basics/)
