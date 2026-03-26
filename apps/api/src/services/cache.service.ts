/**
 * Cache Service - cache en memoria con expiracion automatica
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // time to live en milisegundos
}

type CacheScope = 'public' | 'private' | 'all' | 'data';

interface CacheInvalidationEntry {
    scope: CacheScope;
    key?: string;
    pattern?: string;
    userId?: string;
    reason?: string;
    at: string;
}

interface CacheInvalidationMeta {
    scope?: CacheScope;
    key?: string;
    pattern?: string;
    userId?: string;
    reason?: string;
}

class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private cleanupTimer: NodeJS.Timeout | null = null;
    private metricsLogTimer: NodeJS.Timeout | null = null;
    private hits = 0;
    private misses = 0;
    private sets = 0;
    private invalidations = 0;
    private expirations = 0;
    private invalidationHistory: CacheInvalidationEntry[] = [];
    private maxHistory = 20;

    constructor() {
        // Limpiar cache expirado cada hora
        this.cleanupTimer = setInterval(() => this.cleanup(), 3600000);

        // Log periodico de metricas (default: 10 min, 0 para desactivar)
        const metricsIntervalMinutes = Number(process.env.CACHE_METRICS_INTERVAL_MINUTES || '10');
        if (Number.isFinite(metricsIntervalMinutes) && metricsIntervalMinutes > 0) {
            this.metricsLogTimer = setInterval(() => this.logMetrics(), metricsIntervalMinutes * 60000);
        }
    }

    /**
     * Obtener valor del cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.misses++;
            this.expirations++;
            return null;
        }

        this.hits++;
        return entry.data as T;
    }

    /**
     * Guardar valor en cache
     */
    set<T>(key: string, data: T, ttlHours: number = 24): void {
        const ttlMs = ttlHours * 3600000;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
        });
        this.sets++;
    }

    /**
     * Invalidar cache especifico
     */
    invalidate(key: string, meta: CacheInvalidationMeta = {}): void {
        if (this.cache.delete(key)) {
            this.invalidations++;
        }
        this.recordInvalidation({
            scope: meta.scope ?? this.inferScopeFromKey(key),
            key: meta.key ?? key,
            userId: meta.userId,
            reason: meta.reason,
        });
    }

    /**
     * Invalidar cache que coincida con patron
     */
    invalidatePattern(pattern: string, meta: CacheInvalidationMeta = {}): void {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                if (this.cache.delete(key)) {
                    this.invalidations++;
                }
            }
        }
        this.recordInvalidation({
            scope: meta.scope ?? this.inferScopeFromPattern(pattern),
            pattern: meta.pattern ?? pattern,
            userId: meta.userId,
            reason: meta.reason,
        });
    }

    /**
     * Limpiar todo el cache
     */
    clear(meta: CacheInvalidationMeta = {}): void {
        this.invalidations += this.cache.size;
        this.cache.clear();
        this.recordInvalidation({
            scope: meta.scope ?? 'all',
            userId: meta.userId,
            reason: meta.reason,
        });
    }

    /**
     * Obtener informacion del cache con detalles de cada entrada
     */
    getStats() {
        const totalReads = this.hits + this.misses;
        const hitRate = totalReads > 0 ? Number(((this.hits / totalReads) * 100).toFixed(2)) : 0;
        const now = Date.now();

        const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
            const ageMs = now - entry.timestamp;
            const ageSeconds = Math.floor(ageMs / 1000);
            const expiresInMs = entry.ttl - ageMs;
            const expiresInSeconds = Math.max(0, Math.floor(expiresInMs / 1000));
            const isExpired = expiresInMs <= 0;

            let type = 'data';
            if (key.startsWith('public:')) type = 'public';
            if (key.startsWith('private:')) type = 'private';

            return {
                key,
                type,
                createdAt: new Date(entry.timestamp),
                ageSeconds,
                expiresInSeconds,
                isExpired,
                ttlHours: entry.ttl / 3600000,
            };
        });

        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            entries: entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
            metrics: {
                hits: this.hits,
                misses: this.misses,
                sets: this.sets,
                invalidations: this.invalidations,
                expirations: this.expirations,
                totalReads,
                hitRate,
            },
            history: this.invalidationHistory,
        };
    }

    /**
     * Log periodico de metricas de cache para tuning de TTL
     */
    private logMetrics(): void {
        const stats = this.getStats();
        const metrics = stats.metrics;
        console.log(
            `Cache metrics | size=${stats.size} reads=${metrics.totalReads} hitRate=${metrics.hitRate}% hits=${metrics.hits} misses=${metrics.misses} sets=${metrics.sets} invalidations=${metrics.invalidations} expirations=${metrics.expirations}`
        );
    }

    /**
     * Limpiar entradas expiradas
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleaned++;
                this.expirations++;
            }
        }

        if (cleaned > 0) {
            console.log(`Cache cleanup: ${cleaned} expired entries removed`);
        }
    }

    private inferScopeFromKey(key: string): CacheScope {
        if (key.startsWith('public:')) return 'public';
        if (key.startsWith('private:')) return 'private';
        return 'data';
    }

    private inferScopeFromPattern(pattern: string): CacheScope {
        const hasPublic = pattern.includes('public:');
        const hasPrivate = pattern.includes('private:');
        if (hasPublic && hasPrivate) return 'all';
        if (hasPublic) return 'public';
        if (hasPrivate) return 'private';
        return 'data';
    }

    private recordInvalidation(entry: Omit<CacheInvalidationEntry, 'at'>) {
        const record: CacheInvalidationEntry = {
            ...entry,
            at: new Date().toISOString(),
        };
        this.invalidationHistory.unshift(record);
        if (this.invalidationHistory.length > this.maxHistory) {
            this.invalidationHistory = this.invalidationHistory.slice(0, this.maxHistory);
        }
    }

    /**
     * Destructor para limpiar el timer
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        if (this.metricsLogTimer) {
            clearInterval(this.metricsLogTimer);
        }
    }
}

export const cacheService = new CacheService();
