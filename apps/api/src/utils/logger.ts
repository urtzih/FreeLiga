import pino from 'pino';
import path from 'path';
import * as fs from 'fs';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Configurar directorio de logs
const logsDir = path.join(process.cwd(), 'logs');

// Configurar streams para multistream
const streams: any[] = [];

// En desarrollo, escribir a archivos de logs
if (isDevelopment) {
  // Asegurar que el directorio existe
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Stream para archivo app.log (todos los logs)
  streams.push({
    level: logLevel,
    stream: pino.destination({
      dest: path.join(logsDir, 'app.log'),
      sync: false,
    }),
  });

  // Stream para archivo error.log (solo errores)
  streams.push({
    level: 'error',
    stream: pino.destination({
      dest: path.join(logsDir, 'error.log'),
      sync: false,
    }),
  });
}

// Stream para stdout - SIEMPRE (para Railway/Docker logs)
streams.push({
  level: logLevel,
  stream: process.stdout,
});

// Crear logger con multistream
export const logger = pino(
  {
    level: logLevel,
    // Información base que se añadirá a todos los logs
    base: {
      env: process.env.NODE_ENV || 'development',
      app: 'freesquash-api',
    },
    // Timestamp legible
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    // Formateo de errores
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    // Redactar información sensible
    redact: {
      paths: ['password', 'req.headers.authorization', 'token', 'accessToken'],
      remove: true,
    },
  },
  pino.multistream(streams)
);

// Helper para crear child loggers con contexto
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

// Helper para logging de operaciones con duración
export const logOperation = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const startTime = Date.now();
  const childLogger = context ? createChildLogger(context) : logger;
  
  childLogger.info({ operation, status: 'started' }, `Starting ${operation}`);
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    childLogger.info(
      { operation, status: 'completed', duration },
      `Completed ${operation} in ${duration}ms`
    );
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    childLogger.error(
      { operation, status: 'failed', duration, error },
      `Failed ${operation} after ${duration}ms`
    );
    
    throw error;
  }
};

// Helper para logging de requests HTTP
export const logRequest = (
  method: string,
  url: string,
  userId?: number,
  metadata?: Record<string, any>
) => {
  logger.info({
    type: 'http_request',
    method,
    url,
    userId,
    ...metadata,
  });
};

// Helper para logging de errores con contexto
export const logError = (
  error: Error | unknown,
  context?: Record<string, any>
) => {
  logger.error({
    type: 'error',
    error: error instanceof Error ? error : new Error(String(error)),
    ...context,
  });
};

// Helper para eventos de negocio
export const logBusinessEvent = (
  event: string,
  data: Record<string, any>
) => {
  logger.info({
    type: 'business_event',
    event,
    ...data,
  });
};

// Helper para métricas/estadísticas
export const logMetric = (
  metric: string,
  value: number,
  unit: string,
  tags?: Record<string, string>
) => {
  logger.info({
    type: 'metric',
    metric,
    value,
    unit,
    tags,
  });
};

export default logger;
