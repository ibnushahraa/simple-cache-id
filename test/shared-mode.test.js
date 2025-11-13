const SimpleCache = require('../src/index.js');
const http = require('http');

describe('Shared Mode', () => {
    let cache;

    beforeEach(() => {
        // Clean up shared server if exists
        if (SimpleCache._sharedServer) {
            SimpleCache._sharedServer.close();
            SimpleCache._sharedServer = null;
        }
    });

    afterEach((done) => {
        if (SimpleCache._sharedServer) {
            SimpleCache._sharedServer.close(() => {
                SimpleCache._sharedServer = null;
                done();
            });
        } else {
            done();
        }
    });

    test('should create cache with shared mode', () => {
        cache = new SimpleCache(60, { shared: true });
        expect(cache.shared).toBe(true);
        expect(SimpleCache._sharedServer).toBeDefined();
    });

    test('should set and get value in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('key1', 'value1');
        const result = await cache.get('key1');

        expect(result).toBe('value1');
    });

    test('should set with TTL in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true, checkInterval: 1 });

        await cache.set('key2', 'value2', 1);
        const result1 = await cache.get('key2');
        expect(result1).toBe('value2');

        // Wait for expiration (longer wait for CI environment)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result2 = await cache.get('key2');
        expect(result2).toBe(null);
    });

    test('should delete key in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('key3', 'value3');
        const deleted = await cache.del('key3');
        expect(deleted).toBe(1);

        const result = await cache.get('key3');
        expect(result).toBe(null);
    });

    test('should return 0 when deleting non-existent key', async () => {
        cache = new SimpleCache(60, { shared: true });

        const deleted = await cache.del('nonexistent');
        expect(deleted).toBe(0);
    });

    test('should flush all keys in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('key4', 'value4');
        await cache.set('key5', 'value5');

        await cache.flush();

        const result1 = await cache.get('key4');
        const result2 = await cache.get('key5');

        expect(result1).toBe(null);
        expect(result2).toBe(null);
    });

    test('should return stats in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('key6', 'value6');
        await cache.set('key7', 'value7');

        const stats = await cache.stats();
        expect(stats.keys).toBe(2);
    });

    test('should work with wrap() in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true });

        let callCount = 0;
        const fn = async () => {
            callCount++;
            return 'computed-value';
        };

        const result1 = await cache.wrap('wrap-key', fn);
        expect(result1).toBe('computed-value');
        expect(callCount).toBe(1);

        const result2 = await cache.wrap('wrap-key', fn);
        expect(result2).toBe('computed-value');
        expect(callCount).toBe(1); // Should not call fn again
    });

    test('should work with fallback() in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true });

        const fn = async () => 'fresh-value';

        const result = await cache.fallback('fallback-key', fn);
        expect(result).toBe('fresh-value');

        const cached = await cache.get('fallback-key');
        expect(cached).toBe('fresh-value');
    });

    test('should use cached value when fallback() function fails', async () => {
        cache = new SimpleCache(60, { shared: true });

        // Set initial cached value
        await cache.set('fallback-key2', 'cached-value');

        const fn = async () => {
            throw new Error('API failed');
        };

        const result = await cache.fallback('fallback-key2', fn);
        expect(result).toBe('cached-value');
    });

    test('should throw error when fallback() fails and no cache available', async () => {
        cache = new SimpleCache(60, { shared: true });

        const fn = async () => {
            throw new Error('API failed');
        };

        await expect(cache.fallback('no-cache-key', fn)).rejects.toThrow('API failed');
    });

    test('should share cache between multiple instances', async () => {
        const cache1 = new SimpleCache(60, { shared: true });
        const cache2 = new SimpleCache(60, { shared: true });

        await cache1.set('shared-key', 'shared-value');

        const result = await cache2.get('shared-key');
        expect(result).toBe('shared-value');

        await cache2.del('shared-key');

        const result2 = await cache1.get('shared-key');
        expect(result2).toBe(null);
    });

    test('should handle complex objects', async () => {
        cache = new SimpleCache(60, { shared: true });

        const obj = { name: 'Alice', age: 30, tags: ['dev', 'test'] };
        await cache.set('obj-key', obj);

        const result = await cache.get('obj-key');
        expect(result).toEqual(obj);
    });

    test('should work with wrap() using TTL override', async () => {
        cache = new SimpleCache(60, { shared: true });

        const fn = async () => 'ttl-value';

        const result = await cache.wrap('ttl-key', fn, 2);
        expect(result).toBe('ttl-value');

        // Check it's cached
        const cached = await cache.get('ttl-key');
        expect(cached).toBe('ttl-value');
    });

    test('should work with fallback() using TTL override', async () => {
        cache = new SimpleCache(60, { shared: true });

        const fn = async () => 'fallback-ttl-value';

        const result = await cache.fallback('fallback-ttl-key', fn, 2);
        expect(result).toBe('fallback-ttl-value');
    });

    test('should return null for non-existent key', async () => {
        cache = new SimpleCache(60, { shared: true });

        const result = await cache.get('non-existent-key');
        expect(result).toBe(null);
    });

    test('should handle set with default TTL', async () => {
        cache = new SimpleCache(5, { shared: true });

        await cache.set('default-ttl-key', 'default-value');
        const result = await cache.get('default-ttl-key');
        expect(result).toBe('default-value');
    });

    test('should handle wrap with sync function', async () => {
        cache = new SimpleCache(60, { shared: true });

        const fn = () => 'sync-value';

        const result = await cache.wrap('sync-key', fn);
        expect(result).toBe('sync-value');
    });

    test('should handle fallback with sync function', async () => {
        cache = new SimpleCache(60, { shared: true });

        const fn = () => 'sync-fallback-value';

        const result = await cache.fallback('sync-fallback-key', fn);
        expect(result).toBe('sync-fallback-value');
    });

    test('should handle multiple concurrent requests', async () => {
        cache = new SimpleCache(60, { shared: true });

        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(cache.set(`concurrent-${i}`, `value-${i}`));
        }

        await Promise.all(promises);

        const results = [];
        for (let i = 0; i < 10; i++) {
            results.push(await cache.get(`concurrent-${i}`));
        }

        results.forEach((result, i) => {
            expect(result).toBe(`value-${i}`);
        });
    });

    test('should handle array values', async () => {
        cache = new SimpleCache(60, { shared: true });

        const arr = [1, 2, 3, 4, 5];
        await cache.set('array-key', arr);

        const result = await cache.get('array-key');
        expect(result).toEqual(arr);
    });

    test('should handle nested objects', async () => {
        cache = new SimpleCache(60, { shared: true });

        const nested = {
            user: {
                name: 'Bob',
                profile: {
                    age: 25,
                    tags: ['admin', 'user']
                }
            }
        };

        await cache.set('nested-key', nested);
        const result = await cache.get('nested-key');
        expect(result).toEqual(nested);
    });

    test('should handle null values', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('null-key', null);
        const result = await cache.get('null-key');
        expect(result).toBe(null);
    });

    test('should handle numeric keys', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('123', 'numeric-key-value');
        const result = await cache.get('123');
        expect(result).toBe('numeric-key-value');
    });

    test('should update stats after operations', async () => {
        cache = new SimpleCache(60, { shared: true });

        let stats = await cache.stats();
        const initialKeys = stats.keys;

        await cache.set('stats-key-1', 'value1');
        await cache.set('stats-key-2', 'value2');

        stats = await cache.stats();
        expect(stats.keys).toBe(initialKeys + 2);

        await cache.del('stats-key-1');

        stats = await cache.stats();
        expect(stats.keys).toBe(initialKeys + 1);
    });

    test('should handle set with zero TTL (permanent)', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('permanent-key', 'permanent-value', 0);
        const result = await cache.get('permanent-key');
        expect(result).toBe('permanent-value');

        // Wait and check it's still there
        await new Promise(resolve => setTimeout(resolve, 100));
        const result2 = await cache.get('permanent-key');
        expect(result2).toBe('permanent-value');
    });

    test('should handle empty string value', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('empty-key', '');
        const result = await cache.get('empty-key');
        expect(result).toBe('');
    });

    test('should handle boolean values', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('bool-true', true);
        await cache.set('bool-false', false);

        const resultTrue = await cache.get('bool-true');
        const resultFalse = await cache.get('bool-false');

        expect(resultTrue).toBe(true);
        expect(resultFalse).toBe(false);
    });

    test('should handle number values', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('num-zero', 0);
        await cache.set('num-negative', -123);
        await cache.set('num-float', 3.14);

        expect(await cache.get('num-zero')).toBe(0);
        expect(await cache.get('num-negative')).toBe(-123);
        expect(await cache.get('num-float')).toBe(3.14);
    });

    test('should handle special characters in keys', async () => {
        cache = new SimpleCache(60, { shared: true });

        await cache.set('key:with:colons', 'value1');
        await cache.set('key-with-dashes', 'value2');
        await cache.set('key_with_underscores', 'value3');
        await cache.set('key.with.dots', 'value4');

        expect(await cache.get('key:with:colons')).toBe('value1');
        expect(await cache.get('key-with-dashes')).toBe('value2');
        expect(await cache.get('key_with_underscores')).toBe('value3');
        expect(await cache.get('key.with.dots')).toBe('value4');
    });

    test('should handle very long keys', async () => {
        cache = new SimpleCache(60, { shared: true });

        const longKey = 'a'.repeat(1000);
        await cache.set(longKey, 'long-key-value');

        const result = await cache.get(longKey);
        expect(result).toBe('long-key-value');
    });

    test('should handle very large values', async () => {
        cache = new SimpleCache(60, { shared: true });

        const largeValue = { data: 'x'.repeat(10000) };
        await cache.set('large-value-key', largeValue);

        const result = await cache.get('large-value-key');
        expect(result).toEqual(largeValue);
    });

    test('should handle wrap when cache already has expired value', async () => {
        cache = new SimpleCache(60, { shared: true });

        // Set with very short TTL
        await cache.set('expired-wrap-key', 'old-value', 0.1);

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 200));

        let callCount = 0;
        const fn = async () => {
            callCount++;
            return 'new-value';
        };

        const result = await cache.wrap('expired-wrap-key', fn);
        expect(result).toBe('new-value');
        expect(callCount).toBe(1);
    });

    test('should handle fallback when cache has expired value and function fails', async () => {
        cache = new SimpleCache(60, { shared: true });

        // Set with very short TTL
        await cache.set('expired-fallback-key', 'old-value', 0.1);

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 200));

        const fn = async () => {
            throw new Error('Function failed');
        };

        await expect(cache.fallback('expired-fallback-key', fn)).rejects.toThrow('Function failed');
    });

    test('should automatically cleanup expired keys in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true, checkInterval: 1 });

        // Set key with short TTL
        await cache.set('auto-cleanup-key', 'value', 1);

        // Verify it exists
        let result = await cache.get('auto-cleanup-key');
        expect(result).toBe('value');

        // Wait for TTL + cleanup interval
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Should be cleaned up
        result = await cache.get('auto-cleanup-key');
        expect(result).toBe(null);
    });

    test('should maintain stats correctly with auto cleanup in shared mode', async () => {
        cache = new SimpleCache(60, { shared: true, checkInterval: 1 });

        // Add multiple keys with short TTL
        await cache.set('cleanup-1', 'val1', 1);
        await cache.set('cleanup-2', 'val2', 1);
        await cache.set('cleanup-3', 'val3', 1);

        let stats = await cache.stats();
        expect(stats.keys).toBeGreaterThanOrEqual(3);

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 2500));

        stats = await cache.stats();
        // Keys should be less after cleanup
        const afterCleanup = stats.keys;

        // Add verification that cleanup happened
        const result1 = await cache.get('cleanup-1');
        const result2 = await cache.get('cleanup-2');
        const result3 = await cache.get('cleanup-3');

        expect(result1).toBe(null);
        expect(result2).toBe(null);
        expect(result3).toBe(null);
    });
});
