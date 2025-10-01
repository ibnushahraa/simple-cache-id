const SimpleCache = require("../src/index");

async function run() {
    const cache = new SimpleCache(3); // default TTL = 3s

    // set & get
    cache.set("foo", "bar");
    console.log("foo:", cache.get("foo")); // bar

    // override TTL
    cache.set("baz", "qux", 1);
    setTimeout(() => {
        console.log("baz after 1.2s:", cache.get("baz")); // null
    }, 1200);

    // wrap sync
    const pi = await cache.wrap("pi", () => Math.PI, 5);
    console.log("pi:", pi);

    // wrap async
    const user = await cache.wrap("user:1", async () => {
        console.log("Fetching user from DB...");
        return { id: 1, name: "Ali" };
    }, 5);
    console.log("user:", user);

    // cached value
    const userAgain = await cache.wrap("user:1", () => {
        throw new Error("Should not be called");
    });
    console.log("user (cached):", userAgain);

    // stats
    console.log("stats:", cache.stats());
}

run();
