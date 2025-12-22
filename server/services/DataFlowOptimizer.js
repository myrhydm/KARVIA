/**
 * Discovery Data Flow Optimizer
 * 
 * Provides caching, batching, and optimization utilities for discovery stage data processing
 */

class DataFlowOptimizer {
    constructor() {
        this.cache = new Map();
        this.requestQueue = new Map();
        this.cacheTTL = {
            qualitativeData: 10 * 60 * 1000,    // 10 minutes
            dimensionScores: 5 * 60 * 1000,     // 5 minutes  
            planGeneration: 15 * 60 * 1000,     // 15 minutes
            userEvents: 2 * 60 * 1000           // 2 minutes
        };
    }

    /**
     * Get cached data with TTL check
     */
    getCached(key, type = 'default') {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const ttl = this.cacheTTL[type] || 5 * 60 * 1000;
        const isExpired = Date.now() - cached.timestamp > ttl;
        
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cached data with timestamp
     */
    setCached(key, data, type = 'default') {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            type
        });
    }

    /**
     * Batch requests to prevent duplicate processing
     */
    async batchRequest(key, requestFn) {
        // Check if request is already in progress
        if (this.requestQueue.has(key)) {
            return await this.requestQueue.get(key);
        }

        // Start new request and add to queue
        const requestPromise = requestFn();
        this.requestQueue.set(key, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Clean up completed request
            this.requestQueue.delete(key);
        }
    }

    /**
     * Create optimized cache key for user data
     */
    createUserCacheKey(userId, dataType, ...params) {
        const paramString = params.length > 0 ? `_${params.join('_')}` : '';
        return `${dataType}_${userId}${paramString}`;
    }

    /**
     * Clear cache for specific user or type
     */
    clearCache(pattern) {
        for (const [key] of this.cache) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const stats = {
            totalEntries: this.cache.size,
            activeRequests: this.requestQueue.size,
            cacheTypes: {}
        };

        for (const [, cached] of this.cache) {
            const type = cached.type || 'default';
            stats.cacheTypes[type] = (stats.cacheTypes[type] || 0) + 1;
        }

        return stats;
    }

    /**
     * Cleanup expired cache entries
     */
    cleanupExpired() {
        const now = Date.now();
        const toDelete = [];

        for (const [key, cached] of this.cache) {
            const ttl = this.cacheTTL[cached.type] || 5 * 60 * 1000;
            if (now - cached.timestamp > ttl) {
                toDelete.push(key);
            }
        }

        for (const key of toDelete) {
            this.cache.delete(key);
        }

        return toDelete.length;
    }
}

module.exports = new DataFlowOptimizer();