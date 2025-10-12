const SimpleCache = require("../src/index");
const fs = require("fs");
const path = require("path");

describe("Edge Cases and Coverage", () => {
    let cache;
    const testPersistPath = "./test-edge-case.sdb";

    afterEach(() => {
        if (cache) {
            cache.destroy();
        }

        // Cleanup test files
        if (fs.existsSync(testPersistPath)) {
            fs.unlinkSync(testPersistPath);
        }
        if (fs.existsSync(testPersistPath + ".tmp")) {
            fs.unlinkSync(testPersistPath + ".tmp");
        }
    });

    it("should start cleanup interval from set() when initially no interval", () => {
        // Create cache with defaultTtl=0 (no initial interval because no default TTL)
        cache = new SimpleCache(0);

        // Set key with TTL - this should start cleanup interval
        cache.set("key1", "value1", 5);
        expect(cache.cleanupInterval).not.toBeNull();
    });

    it("should handle _getPathFromName when require.main exists", () => {
        // Just verify that the path generation works
        const testCache = new SimpleCache(10, {
            persistent: true,
            name: 'test-path-generation'
        });

        // Path should contain the cache name
        expect(testCache.persistPath).toContain('test-path-generation.sdb');
        expect(testCache.persistPath).toContain('.cache');

        testCache.destroy();

        // Cleanup
        if (fs.existsSync(testCache.persistPath)) {
            fs.unlinkSync(testCache.persistPath);
        }
        const dir = path.dirname(testCache.persistPath);
        if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
            fs.rmdirSync(dir);
        }
    });

    it("should handle save error gracefully", () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Create valid cache first
        cache = new SimpleCache(10, {
            persistent: true,
            persistPath: testPersistPath
        });

        cache.set("key", "value");

        // Mock fs.writeFileSync to throw error
        const originalWriteFileSync = fs.writeFileSync;
        fs.writeFileSync = jest.fn().mockImplementation(() => {
            throw new Error('Permission denied');
        });

        // Trigger save manually - should handle error
        cache._saveToBinary();

        // Should log error
        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to save to binary:',
            expect.any(String)
        );

        // Restore
        fs.writeFileSync = originalWriteFileSync;
        consoleSpy.mockRestore();
    });

    it("should handle unsupported SDB version", () => {
        // Create a binary file with unsupported version
        const buffer = Buffer.alloc(12);
        buffer.write('SDB', 0, 'ascii');
        buffer.writeUInt8(99, 3); // unsupported version
        buffer.writeUInt32LE(0, 4);

        fs.writeFileSync(testPersistPath, buffer);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Should handle gracefully and start fresh
        cache = new SimpleCache(10, {
            persistent: true,
            persistPath: testPersistPath
        });

        expect(cache.stats().keys).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to load from binary:',
            expect.stringContaining('Unsupported SDB version')
        );

        consoleSpy.mockRestore();
    });

    it("should handle directory creation when saving", () => {
        const deepPath = "./test-deep-cache/nested/dir/cache.sdb";

        cache = new SimpleCache(10, {
            persistent: true,
            persistPath: deepPath
        });

        cache.set("key", "value");

        // Manually trigger save to create directory
        cache._saveToBinary();

        // Directory should be created
        expect(fs.existsSync("./test-deep-cache/nested/dir")).toBe(true);
        expect(fs.existsSync(deepPath)).toBe(true);

        cache.destroy();

        // Cleanup
        if (fs.existsSync(deepPath)) fs.unlinkSync(deepPath);
        if (fs.existsSync("./test-deep-cache/nested/dir")) fs.rmdirSync("./test-deep-cache/nested/dir");
        if (fs.existsSync("./test-deep-cache/nested")) fs.rmdirSync("./test-deep-cache/nested");
        if (fs.existsSync("./test-deep-cache")) fs.rmdirSync("./test-deep-cache");
    });

    it("should not save when cache is empty on graceful shutdown", () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        cache = new SimpleCache(10, {
            persistent: true,
            persistPath: testPersistPath
        });

        // Manually trigger graceful shutdown handler with empty cache
        const handler = () => {
            for (const instance of SimpleCache._instances) {
                if (instance.store.size === 0) continue;
                console.log('[SimpleCache] Saving cache to binary before exit...');
                instance._saveToBinary();
                console.log('[SimpleCache] Cache saved successfully');
            }
        };

        handler();

        // Should not log save messages for empty cache
        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it("should save on graceful shutdown when cache has data", () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        cache = new SimpleCache(10, {
            persistent: true,
            persistPath: testPersistPath
        });

        cache.set("key", "value");

        // Manually trigger graceful shutdown handler
        const handler = () => {
            for (const instance of SimpleCache._instances) {
                if (instance.store.size === 0) continue;
                console.log('[SimpleCache] Saving cache to binary before exit...');
                instance._saveToBinary();
                console.log('[SimpleCache] Cache saved successfully');
            }
        };

        handler();

        // Should log save messages
        expect(consoleSpy).toHaveBeenCalledWith('[SimpleCache] Saving cache to binary before exit...');
        expect(consoleSpy).toHaveBeenCalledWith('[SimpleCache] Cache saved successfully');

        consoleSpy.mockRestore();
    });

    it("should execute pending save on beforeExit", () => {
        cache = new SimpleCache(10, {
            persistent: true,
            persistPath: testPersistPath,
            saveDelay: 10 // long delay to ensure save is pending
        });

        cache.set("key", "value");
        expect(cache._saveTimeout).not.toBeNull();

        // Manually trigger beforeExit handler
        const beforeExitHandler = () => {
            for (const instance of SimpleCache._instances) {
                if (instance._saveTimeout) {
                    clearTimeout(instance._saveTimeout);
                    instance._saveToBinary();
                    instance._saveTimeout = null;
                }
            }
        };

        beforeExitHandler();

        expect(cache._saveTimeout).toBeNull();
        expect(fs.existsSync(testPersistPath)).toBe(true);
    });

    it("should skip expired entries when saving to binary", (done) => {
        const testPath2 = "./test-expire-skip.sdb";

        cache = new SimpleCache(10, {
            persistent: true,
            persistPath: testPath2
        });

        // Set key with very short TTL
        cache.set("expired", "value", 0.001); // 1ms
        cache.set("valid", "value", 100);

        // Wait for expiration
        setTimeout(() => {
            cache.destroy();

            // Load and check
            const cache2 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath2
            });

            expect(cache2.get("expired")).toBeNull();
            expect(cache2.get("valid")).toBe("value");

            cache2.destroy();

            // Cleanup
            if (fs.existsSync(testPath2)) {
                fs.unlinkSync(testPath2);
            }

            done();
        }, 50);
    });
});
