import { CacheEntry, CacheStatus, CacheStrategy, SearchResult } from "@/types";



export class CacheManager {
    public getSize(): number {
        return this.cache.size;
    }

    public getStatus(): CacheStatus {
        const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
        const now = Date.now();
        
        // Calculate memory usage estimation
        const memoryBytes = this.calculateMemoryUsage();
        
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            strategy: this.strategy,
            ttl: this.ttl,
            utilization: this.cache.size / this.maxSize,
            oldestEntryAge: timestamps.length ? now - Math.min(...timestamps) : null,
            newestEntryAge: timestamps.length ? now - Math.max(...timestamps) : null,
            memoryUsage: {
                bytes: memoryBytes,
                formatted: this.formatBytes(memoryBytes)
            }
        };
    }

    private calculateMemoryUsage(): number {
        let totalSize = 0;

        // Estimate size of cache entries
        for (const [key, entry] of this.cache.entries()) {
            // Key size (2 bytes per character in UTF-16)
            totalSize += key.length * 2;

            // Entry overhead (timestamp, lastAccessed, accessCount)
            totalSize += 8 * 3; // 8 bytes per number

            // Estimate size of cached data
            totalSize += this.estimateDataSize(entry.data);
        }

        // Add overhead for Map structure and class properties
        totalSize += 8 * (
            1 + // maxSize
            1 + // ttl
            1 + // strategy string reference
            this.accessOrder.length + // access order array
            3   // stats object numbers
        );

        return totalSize;
    }

    private estimateDataSize(data: SearchResult<unknown>[]): number {
        let size = 0;
        
        for (const result of data) {
            // Basic properties
            size += 8; // score (number)
            size += result.matches.join('').length * 2; // matches array strings
            
            // Estimate item size (conservative estimate)
            size += JSON.stringify(result.item).length * 2;
            
            // Metadata if present
            if (result.metadata) {
                size += JSON.stringify(result.metadata).length * 2;
            }
        }

        return size;
    }

    private formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    private cache: Map<string, CacheEntry>;
    private readonly maxSize: number;
    private readonly ttl: number;
    private strategy: CacheStrategy; // Changed from readonly to private
    private accessOrder: string[];
    private stats: {
        hits: number;
        misses: number;
        evictions: number;
    };

    constructor(
        maxSize: number = 1000, 
        ttlMinutes: number = 5, 
        initialStrategy: CacheStrategy = 'LRU'
    ) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttlMinutes * 60 * 1000;
        this.strategy = initialStrategy;
        this.accessOrder = [];
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }

    set(key: string, data: SearchResult<unknown>[]): void {
        if (this.cache.size >= this.maxSize) {
            this.evict();
        }

        const entry: CacheEntry = {
            data,
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1
        };

        this.cache.set(key, entry);
        this.updateAccessOrder(key);
    }

    get(key: string): SearchResult<unknown>[] | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (this.isExpired(entry.timestamp)) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            this.stats.misses++;
            return null;
        }

        entry.lastAccessed = Date.now();
        entry.accessCount++;
        this.updateAccessOrder(key);
        this.stats.hits++;

        return entry.data;
    }

    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }

    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses),
            strategy: this.strategy
        };
    }

    private isExpired(timestamp: number): boolean {
        return Date.now() - timestamp > this.ttl;
    }

    private evict(): void {
        const keyToEvict = this.strategy === 'LRU' 
            ? this.findLRUKey()
            : this.findMRUKey();

        if (keyToEvict) {
            this.cache.delete(keyToEvict);
            this.removeFromAccessOrder(keyToEvict);
            this.stats.evictions++;
        }
    }

    private findLRUKey(): string | null {
        return this.accessOrder[0] || null;
    }

    private findMRUKey(): string | null {
        return this.accessOrder[this.accessOrder.length - 1] || null;
    }

    private updateAccessOrder(key: string): void {
        this.removeFromAccessOrder(key);

        if (this.strategy === 'LRU') {
            this.accessOrder.push(key); // Most recently used at end
        } else {
            this.accessOrder.unshift(key); // Most recently used at start
        }
    }

    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    setStrategy(newStrategy: CacheStrategy): void {
        if (newStrategy === this.strategy) return;
        
        this.strategy = newStrategy;
        const entries = [...this.accessOrder];
        this.accessOrder = [];
        entries.forEach(key => this.updateAccessOrder(key));
    }

    prune(): number {
        let prunedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry.timestamp)) {
                this.cache.delete(key);
                this.removeFromAccessOrder(key);
                prunedCount++;
            }
        }
        return prunedCount;
    }

    analyze(): {
        hitRate: number;
        averageAccessCount: number;
        mostAccessedKeys: Array<{ key: string; count: number }>;
    } {
        const totalAccesses = this.stats.hits + this.stats.misses;
        const hitRate = totalAccesses > 0 ? this.stats.hits / totalAccesses : 0;

        let totalAccessCount = 0;
        const accessCounts = new Map<string, number>();

        for (const [key, entry] of this.cache.entries()) {
            totalAccessCount += entry.accessCount;
            accessCounts.set(key, entry.accessCount);
        }

        const averageAccessCount = this.cache.size > 0 
            ? totalAccessCount / this.cache.size 
            : 0;

        const mostAccessedKeys = Array.from(accessCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([key, count]) => ({ key, count }));

        return {
            hitRate,
            averageAccessCount,
            mostAccessedKeys
        };
    }
}