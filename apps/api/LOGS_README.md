# 📊 Sistema de Logs - Guía Rápida

## Comandos de Análisis

```bash
# Ver estadísticas de eventos de negocio
npm run logs:events

# Analizar errores
npm run logs:errors

# Métricas de performance
npm run logs:performance

# Actividad de usuarios
npm run logs:users

# Timeline de actividad
npm run logs:timeline

# Generar dashboard HTML
npm run logs:dashboard
# Luego abre: apps/api/logs/dashboard.html
```

## Consultas Personalizadas

```bash
# Filtrar por nivel
npm run logs:query -- --level error --limit 50

# Filtrar por tipo
npm run logs:query -- --type business_event --limit 100

# Filtrar por evento específico
npm run logs:query -- --event match_created --limit 20
```

## Uso en el Código

```typescript
import { logger, logBusinessEvent, logError } from './utils/logger';

// Log básico
logger.info('Mensaje informativo');

// Log con contexto
logger.info({ userId, matchId }, 'Partido actualizado');

// Evento de negocio
logBusinessEvent('match_created', {
  matchId: match.id,
  player1: 'John',
  player2: 'Jane',
});

// Error con contexto
try {
  // código
} catch (error) {
  logError(error, { operation: 'update_match', matchId });
}
```

## Ver Logs en Vivo

```bash
# Desarrollo (pretty format)
npm run dev

# Ver logs en archivo
tail -f apps/api/logs/app.log

# Solo errores
tail -f apps/api/logs/error.log

# Con jq (formato bonito)
tail -f apps/api/logs/app.log | jq
```

## Dashboard Visual

Genera un dashboard HTML con gráficas:

```bash
npm run logs:dashboard
```

Luego abre `apps/api/logs/dashboard.html` en tu navegador.

## Documentación Completa

Ver [LOGGING_SYSTEM.md](../../docs/LOGGING_SYSTEM.md) para documentación detallada.
