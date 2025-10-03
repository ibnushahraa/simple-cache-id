const SimpleCache = require("../src/index");
const fs = require("fs");

describe("Persistent Mode - New Features", () => {
    const testPath1 = "./test-debounce.sdb";
    const testPath2 = "./test-locking.sdb";

    afterEach(() => {
        // Cleanup
        [testPath1, testPath2].forEach(p => {
            if (fs.existsSync(p)) fs.unlinkSync(p);
            if (fs.existsSync(p + ".tmp")) fs.unlinkSync(p + ".tmp");
        });
    });

    describe("File Locking", () => {
        it("should throw error when persistent=true without name or persistPath", () => {
            expect(() => {
                new SimpleCache(10, { persistent: true });
            }).toThrow('[SimpleCache] persistent=true requires either "name" or "persistPath" option');
        });

        it("should prevent multiple instances with same persistPath", () => {
            const cache1 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1
            });

            expect(() => {
                new SimpleCache(10, {
                    persistent: true,
                    persistPath: testPath1
                });
            }).toThrow('[SimpleCache] Cache file already in use by another instance');

            cache1.destroy();
        });

        it("should allow new instance after destroy", () => {
            const cache1 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1
            });
            cache1.set("key", "value1");
            cache1.destroy();

            // Should not throw
            const cache2 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1
            });
            expect(cache2.get("key")).toBe("value1");
            cache2.destroy();
        });
    });

    describe("Debounced Save", () => {
        it("should schedule save after set", () => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 1
            });

            cache.set("key", "value");
            expect(cache._saveTimeout).not.toBeNull();

            cache.destroy();
        });

        it("should debounce multiple sets", (done) => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 1
            });

            cache.set("key1", "value1");
            const timeout1 = cache._saveTimeout;

            setTimeout(() => {
                cache.set("key2", "value2");
                const timeout2 = cache._saveTimeout;

                // Timer should be reset (different timeout object)
                expect(timeout2).not.toBe(timeout1);

                cache.destroy();
                done();
            }, 500);
        });

        it("should save on destroy even with pending timeout", () => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 10 // Long delay
            });

            cache.set("key", "value");
            expect(cache._saveTimeout).not.toBeNull();

            cache.destroy(); // Should save immediately

            // File should exist
            expect(fs.existsSync(testPath1)).toBe(true);

            // Verify data
            const cache2 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1
            });
            expect(cache2.get("key")).toBe("value");
            cache2.destroy();
        });

        it("should cancel pending save on flush", (done) => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 1
            });

            cache.set("key", "value");
            expect(cache._saveTimeout).not.toBeNull();

            cache.flush();
            expect(cache._saveTimeout).toBeNull();

            // Wait to ensure no save happened
            setTimeout(() => {
                expect(fs.existsSync(testPath1)).toBe(false);
                cache.destroy();
                done();
            }, 1500);
        });

        it("should schedule save on del", () => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 1
            });

            cache.set("key", "value");
            cache.destroy(); // Clear pending save

            const cache2 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 1
            });

            cache2.del("key");
            expect(cache2._saveTimeout).not.toBeNull();

            cache2.destroy();
        });

        it("should not schedule save on del if key not found", () => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 1
            });

            cache.del("nonexistent");
            expect(cache._saveTimeout).toBeNull();

            cache.destroy();
        });
    });

    describe("Custom saveDelay", () => {
        it("should use custom saveDelay", (done) => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1,
                saveDelay: 0.5 // 500ms
            });

            cache.set("key", "value");

            // Check file doesn't exist immediately
            expect(fs.existsSync(testPath1)).toBe(false);

            // Wait for save
            setTimeout(() => {
                expect(fs.existsSync(testPath1)).toBe(true);
                cache.destroy();
                done();
            }, 700);
        });

        it("should default to 3 seconds if not specified", () => {
            const cache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPath1
            });

            expect(cache.saveDelay).toBe(3);
            cache.destroy();
        });
    });
});
