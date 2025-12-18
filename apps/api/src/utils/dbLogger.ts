/**
 * Database Transaction Logger
 * Registra todas las operaciones de base de datos importantes
 */

import { logger } from './logger';
import { Prisma } from '@freesquash/database';

export interface DbLogContext {
  operation: string;
  model: string;
  duration?: number;
  recordId?: string;
  userId?: number;
  affected?: number;
}

/**
 * Log de creación de registro
 */
export function logDbCreate(
  model: string,
  recordId: string,
  userId?: number,
  metadata?: Record<string, any>
) {
  logger.info({
    type: 'db_create',
    operation: 'create',
    model,
    recordId,
    userId,
    ...metadata,
  }, `📝 Created ${model}: ${recordId}`);
}

/**
 * Log de actualización de registro
 */
export function logDbUpdate(
  model: string,
  recordId: string,
  changes: Record<string, any>,
  userId?: number
) {
  logger.info({
    type: 'db_update',
    operation: 'update',
    model,
    recordId,
    changes: Object.keys(changes),
    userId,
  }, `✏️  Updated ${model}: ${recordId}`);
}

/**
 * Log de eliminación de registro
 */
export function logDbDelete(
  model: string,
  recordId: string,
  userId?: number,
  metadata?: Record<string, any>
) {
  logger.info({
    type: 'db_delete',
    operation: 'delete',
    model,
    recordId,
    userId,
    ...metadata,
  }, `🗑️  Deleted ${model}: ${recordId}`);
}

/**
 * Log de query lenta
 */
export function logSlowQuery(
  operation: string,
  model: string,
  duration: number,
  query?: any
) {
  logger.warn({
    type: 'slow_query',
    operation,
    model,
    duration,
    query: query ? JSON.stringify(query) : undefined,
  }, `🐌 Slow query: ${operation} on ${model} took ${duration}ms`);
}

/**
 * Log de error de base de datos
 */
export function logDbError(
  operation: string,
  model: string,
  error: Error,
  context?: Record<string, any>
) {
  logger.error({
    type: 'db_error',
    operation,
    model,
    error: {
      message: error.message,
      code: (error as any).code,
      meta: (error as any).meta,
    },
    ...context,
  }, `❌ Database error: ${operation} on ${model} failed`);
}

/**
 * Wrapper para operaciones de DB con logging automático
 */
export async function loggedDbOperation<T>(
  operation: string,
  model: string,
  fn: () => Promise<T>,
  userId?: number
): Promise<T> {
  const startTime = Date.now();
  
  logger.debug({
    type: 'db_operation_start',
    operation,
    model,
    userId,
  }, `Starting ${operation} on ${model}`);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    logger.info({
      type: 'db_operation_complete',
      operation,
      model,
      duration,
      userId,
    }, `✓ ${operation} on ${model} completed in ${duration}ms`);

    // Advertir si es lenta
    if (duration > 1000) {
      logSlowQuery(operation, model, duration);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logDbError(operation, model, error as Error, { duration, userId });
    throw error;
  }
}

/**
 * Middleware de Prisma para logging automático
 */
export function createPrismaLoggingMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const startTime = Date.now();
    
    try {
      const result = await next(params);
      const duration = Date.now() - startTime;

      // Log según tipo de operación
      const logData = {
        type: 'prisma_query',
        model: params.model,
        action: params.action,
        duration,
      };

      if (duration > 1000) {
        logger.warn(logData, `🐌 Slow Prisma query: ${params.action} on ${params.model} (${duration}ms)`);
      } else if (process.env.LOG_LEVEL === 'debug') {
        logger.debug(logData, `Prisma query: ${params.action} on ${params.model} (${duration}ms)`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error({
        type: 'prisma_error',
        model: params.model,
        action: params.action,
        duration,
        error,
      }, `❌ Prisma error: ${params.action} on ${params.model}`);
      
      throw error;
    }
  };
}
