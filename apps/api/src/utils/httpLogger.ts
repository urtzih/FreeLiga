/**
 * Middleware de HTTP Logging
 * Registra todas las requests HTTP con detalles completos
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { logger } from './logger';

export interface HttpLogContext {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: number;
  userRole?: string;
  statusCode?: number;
  responseTime?: number;
  error?: any;
}

/**
 * Plugin para loguear todas las requests HTTP
 */
export async function registerHttpLogging(fastify: FastifyInstance) {
  // Hook para capturar inicio de request
  fastify.addHook('onRequest', async (request, reply) => {
    (request as any).startTime = Date.now();
    
    // Obtener información del usuario si está autenticado
    let userId: number | undefined;
    let userRole: string | undefined;
    
    try {
      const decoded = request.user as any;
      userId = decoded?.id;
      userRole = decoded?.role;
    } catch {
      // Usuario no autenticado
    }

    // Log de request entrante
    logger.info({
      type: 'http_request_start',
      requestId: request.id,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId,
      userRole,
      query: request.query,
      hasBody: !!request.body,
    }, `→ ${request.method} ${request.url}`);
  });

  // Hook para capturar respuesta
  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime || Date.now();
    const duration = Date.now() - startTime;
    const statusCode = reply.statusCode;

    let userId: number | undefined;
    let userRole: string | undefined;
    
    try {
      const decoded = request.user as any;
      userId = decoded?.id;
      userRole = decoded?.role;
    } catch {
      // Usuario no autenticado
    }

    const logData = {
      type: 'http_request_complete',
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode,
      responseTime: duration,
      userId,
      userRole,
      ip: request.ip,
    };

    // Determinar nivel de log según status code
    if (statusCode >= 500) {
      logger.error(logData, `✗ ${request.method} ${request.url} - ${statusCode} (${duration}ms)`);
    } else if (statusCode >= 400) {
      logger.warn(logData, `⚠ ${request.method} ${request.url} - ${statusCode} (${duration}ms)`);
    } else {
      logger.info(logData, `✓ ${request.method} ${request.url} - ${statusCode} (${duration}ms)`);
    }

    // Log de performance si es lento (>1s)
    if (duration > 1000) {
      logger.warn({
        type: 'slow_request',
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode,
        responseTime: duration,
        userId,
      }, `🐌 Slow request: ${request.method} ${request.url} took ${duration}ms`);
    }
  });
}

/**
 * Middleware alternativo para onRequest
 */
export async function httpLoggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  (request as any).startTime = Date.now();
}

/**
 * Hook para errores HTTP
 */
export function httpErrorHook(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const duration = Date.now() - (request as any).startTime;

  logger.error({
    type: 'http_error',
    requestId: request.id,
    method: request.method,
    url: request.url,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    userId: (request.user as any)?.id,
    responseTime: duration,
    statusCode: reply.statusCode,
  }, `✗ HTTP Error: ${error.message}`);
}

/**
 * Middleware para loguear accesos a endpoints protegidos
 */
export function logProtectedAccess(
  request: FastifyRequest,
  endpoint: string,
  action: string
) {
  const user = request.user as any;
  
  logger.info({
    type: 'protected_access',
    endpoint,
    action,
    userId: user?.id,
    userRole: user?.role,
    requestId: request.id,
    ip: request.ip,
  }, `🔒 Protected access: ${action} by user ${user?.id} (${user?.role})`);
}

/**
 * Log de autenticación
 */
export function logAuthentication(
  success: boolean,
  email: string,
  userId?: number,
  ip?: string,
  reason?: string
) {
  if (success) {
    logger.info({
      type: 'auth_success',
      email,
      userId,
      ip,
    }, `🔓 Authentication successful: ${email}`);
  } else {
    logger.warn({
      type: 'auth_failure',
      email,
      ip,
      reason,
    }, `🔒 Authentication failed: ${email} - ${reason}`);
  }
}

/**
 * Log de cambios de autorización
 */
export function logAuthorizationDenied(
  request: FastifyRequest,
  resource: string,
  action: string,
  reason?: string
) {
  const user = request.user as any;
  
  logger.warn({
    type: 'authorization_denied',
    userId: user?.id,
    userRole: user?.role,
    resource,
    action,
    reason,
    requestId: request.id,
    ip: request.ip,
  }, `⛔ Authorization denied: ${user?.role} tried to ${action} ${resource}`);
}
