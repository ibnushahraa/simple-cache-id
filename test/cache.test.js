const SimpleCache = require("../src/index");
const fs = require("fs");
const path = require("path");

describe("SimpleCache", () => {
    let cache;
    const testPersistPath = "./test-cache.sdb";

    beforeEach(() => {
        // checkInterval = 1 detik untuk test lebih cepat
        cache = new SimpleCache(5, { checkInterval: 1 });
    });

    afterEach(() => {
        if (cache) {
            cache.destroy(); // stop interval dan clear cache
        }

        // Cleanup test binary file
        if (fs.existsSync(testPersistPath)) {
            fs.unlinkSync(testPersistPath);
        }
        if (fs.existsSync(testPersistPath + ".tmp")) {
            fs.unlinkSync(testPersistPath + ".tmp");
        }
    });

    afterAll(() => {
        jest.useRealTimers(); // ensure no fake timers remain
    });

    it("should set and get values", () => {
        cache.set("foo", "bar");
        expect(cache.get("foo")).toBe("bar");
    });

    it("should return null for non-existent key", () => {
        expect(cache.get("nonexistent")).toBeNull();
    });

    it("should override default ttl per key", (done) => {
        cache.set("baz", "qux", 1); // ttl = 1s

        // Test sebelum expired
        expect(cache.get("baz")).toBe("qux");

        // Test setelah expired (tunggu interval + buffer)
        setTimeout(() => {
            expect(cache.get("baz")).toBeNull();
            done();
        }, 2000); // 1s TTL + 1s interval + buffer
    });

    it("should use lazy deletion on get", (done) => {
        cache.set("lazy", "value", 1); // ttl = 1s

        // Tunggu sampai expired tapi sebelum interval cleanup
        setTimeout(() => {
            expect(cache.get("lazy")).toBeNull(); // lazy deletion saat get
            expect(cache.stats().keys).toBe(0); // sudah dihapus
            done();
        }, 1100);
    });

    it("should delete a key manually", () => {
        cache.set("temp", "value");
        expect(cache.del("temp")).toBe(1);
        expect(cache.get("temp")).toBeNull();
        expect(cache.del("temp")).toBe(0); // already deleted
    });

    it("should flush all keys and stop interval", () => {
        cache.set("a", 1);
        cache.set("b", 2);

        expect(cache.stats().keys).toBe(2);

        cache.flush();

        expect(cache.stats().keys).toBe(0);
        expect(cache.cleanupInterval).toBeNull(); // interval stopped
    });

    it("should handle permanent keys (ttl = 0)", () => {
        cache.set("permanent", "value", 0);
        expect(cache.get("permanent")).toBe("value");
        expect(cache.expiries.has("permanent")).toBe(false);
    });

    it("should cleanup expired keys via interval", (done) => {
        const testCache = new SimpleCache(1, 1); // TTL 1s, interval 1s

        testCache.set("key1", "value1");
        testCache.set("key2", "value2");
        testCache.set("key3", "value3");

        expect(testCache.stats().keys).toBe(3);

        // Tunggu interval cleanup
        setTimeout(() => {
            expect(testCache.stats().keys).toBe(0);
            testCache.destroy();
            done();
        }, 2500); // 1s TTL + 1s interval + buffer
    });

    it("should only create one cleanup interval", () => {
        cache.set("key1", "value1", 10);
        const interval1 = cache.cleanupInterval;

        cache.set("key2", "value2", 10);
        const interval2 = cache.cleanupInterval;

        cache.set("key3", "value3", 10);
        const interval3 = cache.cleanupInterval;

        // Semua harus reference ke interval yang sama
        expect(interval1).toBe(interval2);
        expect(interval2).toBe(interval3);
        expect(interval1).not.toBeNull();
    });

    it("should wrap values and cache them", async () => {
        let calls = 0;
        const fn = () => {
            calls++;
            return "wrapped-value";
        };

        const v1 = await cache.wrap("key1", fn);
        const v2 = await cache.wrap("key1", fn);

        expect(v1).toBe("wrapped-value");
        expect(v2).toBe("wrapped-value");
        expect(calls).toBe(1); // fn only called once
    });

    it("should work with async wrap function", async () => {
        let calls = 0;
        const fn = async () => {
            calls++;
            return { id: 1, name: "Ali" };
        };

        const v1 = await cache.wrap("user:1", fn);
        const v2 = await cache.wrap("user:1", fn);

        expect(v1).toEqual({ id: 1, name: "Ali" });
        expect(v2).toEqual({ id: 1, name: "Ali" });
        expect(calls).toBe(1);
    });

    it("should wrap with custom ttl", (done) => {
        const fn = () => "value";

        cache.wrap("key", fn, 1).then(() => {
            expect(cache.get("key")).toBe("value");

            setTimeout(() => {
                expect(cache.get("key")).toBeNull();

                // Wrap lagi, fn harus dipanggil ulang
                cache.wrap("key", fn, 1).then((newValue) => {
                    expect(newValue).toBe("value");
                    done();
                });
            }, 2000);
        });
    });

    it("should destroy cache properly", () => {
        cache.set("key", "value", 10);
        expect(cache.cleanupInterval).not.toBeNull();

        cache.destroy();

        expect(cache.cleanupInterval).toBeNull();
        expect(cache.stats().keys).toBe(0);
    });

    it("should handle multiple expiries with different TTLs", (done) => {
        cache.set("short", "value1", 1);  // 1s
        cache.set("medium", "value2", 2); // 2s
        cache.set("long", "value3", 5);   // 5s

        // After 1.5s, short expired
        setTimeout(() => {
            expect(cache.get("short")).toBeNull();
            expect(cache.get("medium")).toBe("value2");
            expect(cache.get("long")).toBe("value3");
        }, 1500);

        // After 2.5s, medium expired
        setTimeout(() => {
            expect(cache.get("short")).toBeNull();
            expect(cache.get("medium")).toBeNull();
            expect(cache.get("long")).toBe("value3");
            done();
        }, 2500);
    });

    it("should support backward compatibility with number as second param", () => {
        const cacheOld = new SimpleCache(5, 2); // old style: (ttl, checkInterval)
        expect(cacheOld.defaultTtl).toBe(5);
        expect(cacheOld.checkInterval).toBe(2);
        expect(cacheOld.persistent).toBe(false);
        cacheOld.destroy();
    });

    // Persistent mode tests
    describe("Persistent Mode", () => {
        it("should save to binary file on destroy", () => {
            const persistCache = new SimpleCache(10, {
                checkInterval: 1,
                persistent: true,
                persistPath: testPersistPath
            });

            persistCache.set("key1", "value1");
            persistCache.set("key2", { name: "test" });
            persistCache.set("key3", 12345);

            persistCache.destroy();

            // File harus dibuat
            expect(fs.existsSync(testPersistPath)).toBe(true);

            // Verify binary format
            const buffer = fs.readFileSync(testPersistPath);
            expect(buffer.toString("ascii", 0, 3)).toBe("SDB"); // magic
        });

        it("should load from binary file on constructor", () => {
            // Create cache dan save data
            const cache1 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            cache1.set("user:1", { id: 1, name: "Alice" });
            cache1.set("counter", 42);
            cache1.destroy();

            // Load dari file
            const cache2 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            expect(cache2.get("user:1")).toEqual({ id: 1, name: "Alice" });
            expect(cache2.get("counter")).toBe(42);
            expect(cache2.stats().keys).toBe(2);

            cache2.destroy();
        });

        it("should not save expired entries to binary", (done) => {
            const persistCache = new SimpleCache(10, {
                checkInterval: 1,
                persistent: true,
                persistPath: testPersistPath
            });

            persistCache.set("short", "value1", 1); // 1s TTL - akan expired
            persistCache.set("long", "value2", 100); // 100s TTL - masih valid

            // Tunggu sampai short expired
            setTimeout(() => {
                persistCache.destroy();

                // Load ulang
                const cache2 = new SimpleCache(10, {
                    persistent: true,
                    persistPath: testPersistPath
                });

                // short tidak ada karena expired
                expect(cache2.get("short")).toBeNull();
                // long masih ada
                expect(cache2.get("long")).toBe("value2");
                expect(cache2.stats().keys).toBe(1);

                cache2.destroy();
                done();
            }, 1500);
        });

        it("should not load expired entries from binary", (done) => {
            const cache1 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            cache1.set("expiring", "value", 1); // 1s TTL
            cache1.destroy();

            // Tunggu sampai expired
            setTimeout(() => {
                const cache2 = new SimpleCache(10, {
                    persistent: true,
                    persistPath: testPersistPath
                });

                // Tidak di-load karena sudah expired
                expect(cache2.get("expiring")).toBeNull();
                expect(cache2.stats().keys).toBe(0);

                cache2.destroy();
                done();
            }, 1500);
        });

        it("should handle permanent keys (ttl=0) in persistent mode", () => {
            const cache1 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            cache1.set("permanent", "forever", 0); // no TTL
            cache1.destroy();

            const cache2 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            expect(cache2.get("permanent")).toBe("forever");
            cache2.destroy();
        });

        it("should handle missing binary file gracefully", () => {
            // File tidak ada, harus tidak error
            const persistCache = new SimpleCache(10, {
                persistent: true,
                persistPath: "./non-existent-cache.sdb"
            });

            expect(persistCache.stats().keys).toBe(0);
            persistCache.destroy();
        });

        it("should handle corrupt binary file gracefully", () => {
            // Buat file corrupt
            fs.writeFileSync(testPersistPath, "CORRUPT DATA");

            // Harus tidak crash, start fresh
            const persistCache = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            expect(persistCache.stats().keys).toBe(0);
            persistCache.destroy();
        });

        it("should support complex data types in persistent mode", () => {
            const cache1 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            const complexData = {
                users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
                meta: { count: 2, nested: { deep: true } },
                tags: ["test", "cache"]
            };

            cache1.set("complex", complexData);
            cache1.destroy();

            const cache2 = new SimpleCache(10, {
                persistent: true,
                persistPath: testPersistPath
            });

            expect(cache2.get("complex")).toEqual(complexData);
            cache2.destroy();
        });
    });
});
