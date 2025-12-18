#!/usr/bin/env node
/**
 * Analizador de logs estructurados
 * Permite consultar, filtrar y generar estadísticas de los logs en formato JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { createReadStream } from 'fs';
import * as zlib from 'zlib';

interface LogEntry {
  level: number;
  time: string;
  msg: string;
  type?: string;
  operation?: string;
  event?: string;
  metric?: string;
  userId?: number;
  matchId?: string;
  groupId?: string;
  error?: any;
  duration?: number;
  [key: string]: any;
}

interface AnalysisOptions {
  logDir?: string;
  level?: string;
  type?: string;
  event?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  operation?: string;
  groupBy?: string;
  limit?: number;
}

class LogAnalyzer {
  private logsDir: string;

  constructor(logsDir?: string) {
    this.logsDir = logsDir || path.join(process.cwd(), 'logs');
  }

  /**
   * Lee todos los archivos de log (incluyendo comprimidos)
   */
  private async *readAllLogs(): AsyncGenerator<LogEntry> {
    const files = fs.readdirSync(this.logsDir);
    
    for (const file of files.sort()) {
      const filePath = path.join(this.logsDir, file);
      
      if (!fs.statSync(filePath).isFile()) continue;
      
      yield* this.readLogFile(filePath);
    }
  }

  /**
   * Lee un archivo de log (soporta .gz)
   */
  private async *readLogFile(filePath: string): AsyncGenerator<LogEntry> {
    const isGzipped = filePath.endsWith('.gz');
    let stream: NodeJS.ReadableStream = createReadStream(filePath);
    
    if (isGzipped) {
      stream = stream.pipe(zlib.createGunzip());
    }

    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const entry = JSON.parse(line) as LogEntry;
        yield entry;
      } catch (error) {
        console.error(`Error parsing log line: ${line.substring(0, 100)}...`);
      }
    }
  }

  /**
   * Filtra logs según criterios
   */
  private matchesFilter(entry: LogEntry, options: AnalysisOptions): boolean {
    // Filtrar por level
    if (options.level) {
      const levelMap: Record<string, number> = {
        trace: 10,
        debug: 20,
        info: 30,
        warn: 40,
        error: 50,
        fatal: 60,
      };
      const requiredLevel = levelMap[options.level.toLowerCase()] || 30;
      if (entry.level < requiredLevel) return false;
    }

    // Filtrar por type
    if (options.type && entry.type !== options.type) return false;

    // Filtrar por event
    if (options.event && entry.event !== options.event) return false;

    // Filtrar por userId
    if (options.userId && entry.userId !== options.userId) return false;

    // Filtrar por operation
    if (options.operation && entry.operation !== options.operation) return false;

    // Filtrar por rango de fechas
    if (options.startDate) {
      const entryDate = new Date(entry.time);
      const startDate = new Date(options.startDate);
      if (entryDate < startDate) return false;
    }

    if (options.endDate) {
      const entryDate = new Date(entry.time);
      const endDate = new Date(options.endDate);
      if (entryDate > endDate) return false;
    }

    return true;
  }

  /**
   * Consulta logs con filtros
   */
  async query(options: AnalysisOptions = {}): Promise<LogEntry[]> {
    const results: LogEntry[] = [];
    let count = 0;
    const limit = options.limit || 1000;

    for await (const entry of this.readAllLogs()) {
      if (this.matchesFilter(entry, options)) {
        results.push(entry);
        count++;
        
        if (count >= limit) break;
      }
    }

    return results;
  }

  /**
   * Genera estadísticas de eventos de negocio
   */
  async businessEventStats(options: AnalysisOptions = {}): Promise<any> {
    const stats: Record<string, { count: number; examples: LogEntry[] }> = {};

    for await (const entry of this.readAllLogs()) {
      if (entry.type === 'business_event' && this.matchesFilter(entry, options)) {
        const event = entry.event || 'unknown';
        
        if (!stats[event]) {
          stats[event] = { count: 0, examples: [] };
        }
        
        stats[event].count++;
        
        if (stats[event].examples.length < 3) {
          stats[event].examples.push(entry);
        }
      }
    }

    return stats;
  }

  /**
   * Analiza errores con frecuencias
   */
  async errorAnalysis(options: AnalysisOptions = {}): Promise<any> {
    const errors: Record<string, { count: number; lastSeen: string; examples: any[] }> = {};

    for await (const entry of this.readAllLogs()) {
      if (entry.level >= 50 && this.matchesFilter(entry, options)) { // error or fatal
        const errorType = entry.error?.type || entry.msg || 'unknown';
        
        if (!errors[errorType]) {
          errors[errorType] = { count: 0, lastSeen: entry.time, examples: [] };
        }
        
        errors[errorType].count++;
        errors[errorType].lastSeen = entry.time;
        
        if (errors[errorType].examples.length < 3) {
          errors[errorType].examples.push({
            time: entry.time,
            msg: entry.msg,
            error: entry.error,
            context: {
              userId: entry.userId,
              matchId: entry.matchId,
              groupId: entry.groupId,
            },
          });
        }
      }
    }

    return Object.entries(errors)
      .sort(([, a], [, b]) => b.count - a.count)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  /**
   * Métricas de performance
   */
  async performanceMetrics(options: AnalysisOptions = {}): Promise<any> {
    const operations: Record<string, { count: number; totalDuration: number; min: number; max: number; durations: number[] }> = {};

    for await (const entry of this.readAllLogs()) {
      if (entry.duration && entry.operation && this.matchesFilter(entry, options)) {
        const op = entry.operation;
        
        if (!operations[op]) {
          operations[op] = { 
            count: 0, 
            totalDuration: 0, 
            min: Infinity, 
            max: -Infinity,
            durations: []
          };
        }
        
        operations[op].count++;
        operations[op].totalDuration += entry.duration;
        operations[op].min = Math.min(operations[op].min, entry.duration);
        operations[op].max = Math.max(operations[op].max, entry.duration);
        operations[op].durations.push(entry.duration);
      }
    }

    // Calcular estadísticas
    const stats: any = {};
    for (const [op, data] of Object.entries(operations)) {
      const avg = data.totalDuration / data.count;
      const sorted = data.durations.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      stats[op] = {
        count: data.count,
        avg: Math.round(avg),
        min: data.min,
        max: data.max,
        p50,
        p95,
        p99,
      };
    }

    return stats;
  }

  /**
   * Actividad por usuario
   */
  async userActivity(options: AnalysisOptions = {}): Promise<any> {
    const users: Record<number, { 
      requests: number; 
      events: string[]; 
      errors: number;
      lastActivity: string;
    }> = {};

    for await (const entry of this.readAllLogs()) {
      if (entry.userId && this.matchesFilter(entry, options)) {
        const userId = entry.userId;
        
        if (!users[userId]) {
          users[userId] = { 
            requests: 0, 
            events: [], 
            errors: 0,
            lastActivity: entry.time
          };
        }
        
        if (entry.type === 'http_request') {
          users[userId].requests++;
        }
        
        if (entry.type === 'business_event') {
          users[userId].events.push(entry.event || 'unknown');
        }
        
        if (entry.level >= 50) {
          users[userId].errors++;
        }

        users[userId].lastActivity = entry.time;
      }
    }

    return Object.entries(users)
      .sort(([, a], [, b]) => b.requests - a.requests)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  /**
   * Timeline de eventos
   */
  async timeline(options: AnalysisOptions = {}): Promise<any> {
    const timeline: Record<string, { events: number; errors: number; requests: number }> = {};

    for await (const entry of this.readAllLogs()) {
      if (this.matchesFilter(entry, options)) {
        const date = entry.time.split('T')[0]; // YYYY-MM-DD
        
        if (!timeline[date]) {
          timeline[date] = { events: 0, errors: 0, requests: 0 };
        }
        
        if (entry.type === 'business_event') {
          timeline[date].events++;
        }
        
        if (entry.level >= 50) {
          timeline[date].errors++;
        }
        
        if (entry.type === 'http_request') {
          timeline[date].requests++;
        }
      }
    }

    return Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const analyzer = new LogAnalyzer();

  try {
    switch (command) {
      case 'query':
        const queryOpts: AnalysisOptions = {
          level: args.includes('--level') ? args[args.indexOf('--level') + 1] : undefined,
          type: args.includes('--type') ? args[args.indexOf('--type') + 1] : undefined,
          event: args.includes('--event') ? args[args.indexOf('--event') + 1] : undefined,
          limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 100,
        };
        const results = await analyzer.query(queryOpts);
        console.log(JSON.stringify(results, null, 2));
        break;

      case 'events':
        const eventStats = await analyzer.businessEventStats();
        console.log('📊 Business Events Statistics:\n');
        console.log(JSON.stringify(eventStats, null, 2));
        break;

      case 'errors':
        const errorStats = await analyzer.errorAnalysis();
        console.log('🚨 Error Analysis:\n');
        console.log(JSON.stringify(errorStats, null, 2));
        break;

      case 'performance':
        const perfStats = await analyzer.performanceMetrics();
        console.log('⚡ Performance Metrics (durations in ms):\n');
        console.log(JSON.stringify(perfStats, null, 2));
        break;

      case 'users':
        const userStats = await analyzer.userActivity();
        console.log('👥 User Activity:\n');
        console.log(JSON.stringify(userStats, null, 2));
        break;

      case 'timeline':
        const timelineData = await analyzer.timeline();
        console.log('📅 Activity Timeline:\n');
        console.log(JSON.stringify(timelineData, null, 2));
        break;

      default:
        console.log(`
FreeSquash Log Analyzer

Usage: tsx src/scripts/analyze-logs.ts <command> [options]

Commands:
  query [options]    Query logs with filters
    --level <level>  Filter by log level (trace, debug, info, warn, error, fatal)
    --type <type>    Filter by log type (business_event, http_request, error, metric)
    --event <event>  Filter by business event name
    --limit <num>    Limit results (default: 100)

  events             Show business event statistics
  errors             Analyze errors with frequencies
  performance        Show performance metrics for operations
  users              Show user activity statistics
  timeline           Show daily activity timeline

Examples:
  tsx src/scripts/analyze-logs.ts events
  tsx src/scripts/analyze-logs.ts errors
  tsx src/scripts/analyze-logs.ts query --type business_event --limit 50
  tsx src/scripts/analyze-logs.ts performance
        `);
    }
  } catch (error) {
    console.error('Error analyzing logs:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { LogAnalyzer };
