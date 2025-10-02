// Example: Persistent Cache
// This demonstrates how cache data survives application restarts

const SimpleCache = require("../src/index");

console.log("=== Persistent Cache Example ===\n");

// Create cache with persistent storage
const cache = new SimpleCache(60, {
  checkInterval: 5,
  persistent: true
  // persistPath defaults to ./.cache/simple-cache.sdb
});

console.log("📊 Initial cache stats:", cache.stats());

// Check if data exists from previous run
const existingUser = cache.get("user:1");
if (existingUser) {
  console.log("✅ Found existing data from previous run!");
  console.log("   User:", existingUser);
} else {
  console.log("📝 No existing data, creating new entries...");

  // Set some data with different TTLs
  cache.set("user:1", { id: 1, name: "Alice", role: "admin" }, 3600); // 1 hour
  cache.set("user:2", { id: 2, name: "Bob", role: "user" }, 3600);
  cache.set("config", { theme: "dark", lang: "en" }, 0); // permanent
  cache.set("temp", "This will expire soon", 5); // 5 seconds

  console.log("✅ Created new cache entries:");
  console.log("   user:1 ->", cache.get("user:1"));
  console.log("   user:2 ->", cache.get("user:2"));
  console.log("   config ->", cache.get("config"));
  console.log("   temp ->", cache.get("temp"));
}

console.log("\n📊 Final cache stats:", cache.stats());

// Save to disk
console.log("\n💾 Saving cache to disk (./.cache/simple-cache.sdb)...");
cache.destroy();

console.log("✅ Done! Run this script again to see data persistence.\n");
console.log("💡 Tip: The cache file is saved at ./.cache/simple-cache.sdb");
console.log("💡 Expired entries are automatically filtered out on save/load");
