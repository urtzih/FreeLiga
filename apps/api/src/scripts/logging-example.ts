/**
 * Ejemplo de uso del sistema de logging estructurado
 * Ejecutar con: tsx src/scripts/logging-example.ts
 */

import { 
  logger, 
  createChildLogger, 
  logBusinessEvent, 
  logError, 
  logOperation,
  logMetric 
} from '../utils/logger';

async function demonstrateLogging() {
  console.log('\n🎯 Demostrando Sistema de Logging Estructurado\n');

  // 1. Log básico
  console.log('1️⃣ Logs básicos:');
  logger.info('Aplicación iniciada');
  logger.debug('Modo de depuración activado');
  logger.warn('Esta es una advertencia');

  // 2. Log con contexto
  console.log('\n2️⃣ Logs con contexto:');
  logger.info({ 
    userId: 123, 
    action: 'login',
    ip: '192.168.1.1' 
  }, 'Usuario autenticado exitosamente');

  // 3. Child logger (mantiene contexto)
  console.log('\n3️⃣ Child logger (contexto persistente):');
  const requestLogger = createChildLogger({ 
    requestId: 'req-abc-123',
    userId: 456 
  });
  
  requestLogger.info('Procesando request');
  requestLogger.info({ endpoint: '/api/matches' }, 'Request completado');

  // 4. Eventos de negocio
  console.log('\n4️⃣ Eventos de negocio:');
  logBusinessEvent('match_created', {
    matchId: 'match-001',
    player1: 'John Doe',
    player2: 'Jane Smith',
    score: '3-1',
    groupId: 'group-A',
  });

  logBusinessEvent('user_registered', {
    userId: 789,
    email: 'nuevo@ejemplo.com',
    role: 'PLAYER',
  });

  // 5. Operaciones con duración
  console.log('\n5️⃣ Operaciones con seguimiento de duración:');
  
  const result1 = await logOperation(
    'calculate_rankings',
    async () => {
      // Simular operación lenta
      await new Promise(resolve => setTimeout(resolve, 150));
      return { rankings: ['player1', 'player2', 'player3'] };
    },
    { groupId: 'group-A' }
  );

  const result2 = await logOperation(
    'send_notifications',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 80));
      return { sent: 5 };
    },
    { type: 'email' }
  );

  // 6. Manejo de errores
  console.log('\n6️⃣ Logging de errores:');
  
  try {
    // Simular error
    throw new Error('Error de validación: campos requeridos faltantes');
  } catch (error) {
    logError(error, {
      operation: 'create_match',
      matchId: 'match-002',
      userId: 123,
    });
  }

  // Error más complejo
  try {
    const error = new Error('Database connection failed');
    (error as any).code = 'ECONNREFUSED';
    (error as any).host = 'localhost:5432';
    throw error;
  } catch (error) {
    logError(error, {
      operation: 'database_query',
      query: 'SELECT * FROM matches',
    });
  }

  // 7. Métricas
  console.log('\n7️⃣ Métricas y estadísticas:');
  
  logMetric('active_users', 42, 'count', { 
    type: 'concurrent' 
  });

  logMetric('response_time', 245, 'ms', { 
    endpoint: '/api/matches',
    method: 'GET'
  });

  logMetric('database_connections', 10, 'count', {
    pool: 'main',
    status: 'active'
  });

  // 8. Diferentes niveles de log
  console.log('\n8️⃣ Diferentes niveles de severidad:');
  
  logger.trace({ detail: 'muy detallado' }, 'Trace level (solo desarrollo)');
  logger.debug({ var: 'value' }, 'Debug info');
  logger.info({ status: 'ok' }, 'Información general');
  logger.warn({ threshold: 80 }, 'Uso de memoria alto');
  logger.error({ code: 500 }, 'Error en el servidor');
  logger.fatal({ reason: 'sin conexión' }, 'Error crítico');

  // 9. Logs complejos con datos estructurados
  console.log('\n9️⃣ Logs complejos estructurados:');
  
  logger.info({
    type: 'http_request',
    method: 'POST',
    url: '/api/matches',
    userId: 123,
    requestBody: {
      groupId: 'group-A',
      player1Id: 'player1',
      player2Id: 'player2',
      gamesP1: 3,
      gamesP2: 1,
    },
    statusCode: 201,
    responseTime: 156,
  }, 'Request procesado exitosamente');

  console.log('\n✅ Demostración completada!\n');
  console.log('📁 Los logs se han guardado en apps/api/logs/');
  console.log('🔍 Analiza los logs con:');
  console.log('   npm run logs:events');
  console.log('   npm run logs:errors');
  console.log('   npm run logs:performance');
  console.log('   npm run logs:dashboard\n');
}

// Ejecutar demostración
demonstrateLogging()
  .then(() => {
    console.log('💡 Tip: Abre apps/api/logs/app.log para ver los logs en formato JSON\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en demostración:', error);
    process.exit(1);
  });
