// simple-cache-id
// Lightweight in-memory cache with default TTL + wrap()

/**
 * @class SimpleCache
 * @classdesc A lightweight in-memory cache with default TTL and helper `wrap()`.
 */
class SimpleCache {
    /**
     * @param {number} [defaultTtl=0] - Default TTL in seconds (0 = no expiration)
     */
    constructor(defaultTtl = 0) {
        /** @type {Map<string, any>} */
        this.store = new Map();

        /** @type {Map<string, NodeJS.Timeout>} */
        this.timeouts = new Map();

        /** @type {number} */
        this.defaultTtl = defaultTtl;
    }

    /**
     * Store a value in the cache with optional TTL.
     * @param {string} key - Unique cache key
     * @param {any} value - Value to store
     * @param {number} [ttl] - TTL in seconds, defaults to constructor TTL
     * @returns {"OK"}
     */
    set(key, value, ttl) {
        // use per-key TTL or default
        const effectiveTtl = typeof ttl === "number" ? ttl : this.defaultTtl;

        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }

        this.store.set(key, value);

        if (effectiveTtl > 0) {
            const timeout = setTimeout(() => {
                this.store.delete(key);
                this.timeouts.delete(key);
            }, effectiveTtl * 1000);

            this.timeouts.set(key, timeout);
        }
        return "OK";
    }

    /**
     * Retrieve a value from the cache.
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }

    /**
     * Delete a key.
     * @param {string} key
     * @returns {number} - 1 if deleted, 0 if not found
     */
    del(key) {
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }
        return this.store.delete(key) ? 1 : 0;
    }

    /**
     * Clear all cache.
     */
    flush() {
        for (const timeout of this.timeouts.values()) {
            clearTimeout(timeout);
        }
        this.timeouts.clear();
        this.store.clear();
    }

    /**
     * Stats
     * @returns {{keys: number}}
     */
    stats() {
        return { keys: this.store.size };
    }

    /**
     * Wrap: return cached value or compute & cache.
     * @template T
     * @param {string} key
     * @param {() => (Promise<T>|T)} fn
     * @param {number} [ttl] - Override TTL
     * @returns {Promise<T>}
     */
    async wrap(key, fn, ttl) {
        const cached = this.get(key);
        if (cached !== null) return cached;

        const result = await fn();
        this.set(key, result, ttl);
        return result;
    }
}

module.exports = SimpleCache;
