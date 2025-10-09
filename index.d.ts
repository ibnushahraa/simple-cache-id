// index.d.ts
// TypeScript definitions for simple-cache-id

/**
 * Configuration options for SimpleCache
 */
interface SimpleCacheOptions {
  /**
   * Interval untuk check expired keys (dalam detik)
   * @default 5
   */
  checkInterval?: number;

  /**
   * Enable persistent storage ke binary file
   * @default false
   */
  persistent?: boolean;

  /**
   * Unique name for this cache (required if persistent=true)
   */
  name?: string;

  /**
   * Custom path to binary file (overrides name)
   */
  persistPath?: string;

  /**
   * Debounce delay in seconds (saves N seconds after last change)
   * @default 3
   */
  saveDelay?: number;
}

/**
 * A lightweight in-memory cache with default TTL and helper wrap()
 */
declare class SimpleCache {
  /**
   * Create a new cache instance
   * @param defaultTtl - Default TTL in seconds (0 = no expiration)
   * @param options - Configuration options (or number for backward compatibility as checkInterval)
   */
  constructor(defaultTtl?: number, options?: SimpleCacheOptions | number);

  /**
   * Store a value in the cache with optional TTL
   * @param key - Unique cache key
   * @param value - Value to store
   * @param ttl - TTL in seconds, defaults to constructor TTL
   * @returns "OK"
   */
  set(key: string, value: any, ttl?: number): "OK";

  /**
   * Retrieve a value from the cache
   * @param key - Cache key
   * @returns The cached value or null if not found
   */
  get<T = any>(key: string): T | null;

  /**
   * Delete a key from the cache
   * @param key - Cache key
   * @returns 1 if deleted, 0 if not found
   */
  del(key: string): number;

  /**
   * Clear all cache entries
   */
  flush(): void;

  /**
   * Destroy cache instance, stop all intervals, and save to binary if persistent=true
   */
  destroy(): void;

  /**
   * Get cache statistics
   * @returns Object containing number of keys
   */
  stats(): { keys: number };

  /**
   * Return cached value or compute and cache it
   * @param key - Cache key
   * @param fn - Function to compute value if not cached
   * @param ttl - Optional TTL override in seconds
   * @returns The cached or computed value
   */
  wrap<T>(key: string, fn: () => T | Promise<T>, ttl?: number): Promise<T>;
}

declare namespace SimpleCache {
  export interface Options {
    checkInterval?: number;
    persistent?: boolean;
    name?: string;
    persistPath?: string;
    saveDelay?: number;
  }
}

// Support both CommonJS and ES Module
export = SimpleCache;
export default SimpleCache;
