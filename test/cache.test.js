const SimpleCache = require("../src/index");

describe("SimpleCache", () => {
    let cache;

    beforeEach(() => {
        cache = new SimpleCache(5);
    });

    afterEach(() => {
        cache.flush(); // clear all timers after each test
    });

    afterAll(() => {
        jest.useRealTimers(); // ensure no fake timers remain
    });

    it("should set and get values", () => {
        cache.set("foo", "bar");
        expect(cache.get("foo")).toBe("bar");
    });

    it("should override default ttl per key", (done) => {
        cache.set("baz", "qux", 1); // ttl = 1s

        setTimeout(() => {
            expect(cache.get("baz")).toBeNull();
            done();
        }, 1200);
    });

    it("should delete a key", () => {
        cache.set("temp", "value");
        expect(cache.del("temp")).toBe(1);
        expect(cache.get("temp")).toBeNull();
    });

    it("should flush all keys", () => {
        cache.set("a", 1);
        cache.set("b", 2);
        cache.flush();
        expect(cache.stats().keys).toBe(0);
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
        expect(calls).toBe(1);
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
});
