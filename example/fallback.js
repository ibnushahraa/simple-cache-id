// Example: Using fallback() method
// Try to get fresh data first, use cache as fallback if error

const SimpleCache = require("../src/index");

// Create cache instance
const cache = new SimpleCache(60); // 60s default TTL

// Simulate API call that might fail
async function fetchUserFromAPI(userId) {
    // Simulate random failures
    if (Math.random() < 0.3) {
        throw new Error("API is down");
    }

    return {
        id: userId,
        name: "John Doe",
        email: "john@example.com",
        timestamp: new Date().toISOString()
    };
}

// Example 1: First call - no cache, will try API
(async () => {
    console.log("=== Example 1: First call (no cache) ===");

    try {
        const user = await cache.fallback("user:123", () => fetchUserFromAPI(123));
        console.log("✓ Got fresh data:", user);
    } catch (error) {
        console.log("✗ Failed:", error.message);
    }

    console.log("\n");
})();

// Example 2: Second call - has cache, but still tries fresh data first
setTimeout(async () => {
    console.log("=== Example 2: Second call (with cache) ===");

    try {
        const user = await cache.fallback("user:123", () => fetchUserFromAPI(123));
        console.log("✓ Got data:", user);
        console.log("  (Notice: timestamp might be different if API succeeded)");
    } catch (error) {
        console.log("✗ Failed:", error.message);
    }

    console.log("\n");
}, 1000);

// Example 3: API fails but cache exists - use cache as fallback
setTimeout(async () => {
    console.log("=== Example 3: API fails, use cache fallback ===");

    // Force API to fail
    const alwaysFail = async () => {
        throw new Error("Network timeout");
    };

    try {
        const user = await cache.fallback("user:123", alwaysFail);
        console.log("✓ Used cache fallback:", user);
        console.log("  (Notice: same timestamp as first successful call)");
    } catch (error) {
        console.log("✗ Failed:", error.message);
    }

    console.log("\n");
}, 2000);

// Example 4: Real-world use case - fetch weather data
setTimeout(async () => {
    console.log("=== Example 4: Weather API with fallback ===");

    async function fetchWeather(city) {
        // Simulate external API
        if (Math.random() < 0.4) {
            throw new Error("Weather API unavailable");
        }

        return {
            city: city,
            temp: Math.floor(Math.random() * 15) + 20,
            condition: "Sunny",
            fetchedAt: new Date().toISOString()
        };
    }

    for (let i = 0; i < 3; i++) {
        try {
            const weather = await cache.fallback(
                "weather:jakarta",
                () => fetchWeather("Jakarta"),
                30 // 30s TTL
            );

            console.log(`  Attempt ${i + 1}:`, {
                temp: weather.temp,
                condition: weather.condition,
                fetchedAt: weather.fetchedAt
            });
        } catch (error) {
            console.log(`  Attempt ${i + 1}: ${error.message} (no cache available)`);
        }

        // Wait a bit between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("\n");
}, 3000);

// Comparison: wrap() vs fallback()
setTimeout(async () => {
    console.log("=== Comparison: wrap() vs fallback() ===");

    let apiCalls = 0;
    const fetchData = async () => {
        apiCalls++;
        if (Math.random() < 0.5) {
            throw new Error("Random API failure");
        }
        return { data: "fresh", apiCalls };
    };

    // Using wrap() - returns cache first, no API call if cached
    console.log("\n1. Using wrap():");
    try {
        const result1 = await cache.wrap("data:wrap", fetchData);
        console.log("   First call:", result1);

        const result2 = await cache.wrap("data:wrap", fetchData);
        console.log("   Second call:", result2, "(no API call, returned cache)");
    } catch (error) {
        console.log("   Error:", error.message);
    }

    apiCalls = 0;

    // Using fallback() - tries API first, cache only if API fails
    console.log("\n2. Using fallback():");
    try {
        const result1 = await cache.fallback("data:fallback", fetchData);
        console.log("   First call:", result1);

        const result2 = await cache.fallback("data:fallback", fetchData);
        console.log("   Second call:", result2, "(tried API again, cache as fallback)");
    } catch (error) {
        console.log("   Error:", error.message);
    }

    console.log("\n=== Summary ===");
    console.log("• wrap():     Cache-first strategy (fast, may serve stale data)");
    console.log("• fallback(): Fresh-first strategy (fresh data, resilient to failures)");

    // Cleanup
    setTimeout(() => {
        cache.destroy();
        console.log("\n✓ Cache destroyed");
    }, 1000);
}, 4500);
