/**
 * Cache Service - 24h cache para datos públicos
 * Gestiona caché en memoria con expiración automática
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // time to live en milisegundos
}

class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor() {
        // Limpiar caché expirado cada hora
        this.cleanupTimer = setInterval(() => this.cleanup(), 3600000);
    }

    /**
     * Obtener valor del caché
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Verificar si ha expirado
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Guardar valor en caché
     * @param key Clave del caché
     * @param data Datos a guardar
     * @param ttlHours Horas de vida (por defecto 24)
     */
    set<T>(key: string, data: T, ttlHours: number = 24): void {
        const ttlMs = ttlHours * 3600000; // convertir a milisegundos
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
        });
    }

    /**
     * Invalidar caché específico
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidar caché que coincida con patrón
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Limpiar todo el caché
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Obtener información del caché
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
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
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
        }
    }

    /**
     * Destructor para limpiar el timer
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
    }
}

// Singleton instance
export const cacheService = new CacheService();
