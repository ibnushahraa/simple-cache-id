# simple-cache-id

[![npm version](https://img.shields.io/npm/v/simple-cache-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-cache-id)
[![npm downloads](https://img.shields.io/npm/dm/simple-cache-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-cache-id)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/ibnushahraa/simple-cache-id/actions/workflows/test.yml/badge.svg)](https://github.com/ibnushahraa/simple-cache-id/actions)
[![Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen.svg?style=flat-square)](https://github.com/ibnushahraa/simple-cache-id)

🔑 A lightweight **in-memory cache** for Node.js with **default TTL**, **persistent storage**, and powerful caching strategies: `wrap()` for cache-first and `fallback()` for fresh-first with resilient fallback.

**Perfect for API caching, external service calls, and offline-first applications.** Think of it as a **tiny Redis-like cache** without any dependencies.

---

## ✨ Features

- Set / Get values with optional TTL (seconds).
- Global default TTL set in constructor.
- Auto-expiration with `setInterval` cleanup.
- **Persistent storage to binary file (.sdb)** - cache survives restarts!
- **Shared cache mode** - share cache across multiple microservices via HTTP!
- `wrap()` helper: fetch from cache or compute if missing.
- `fallback()` helper: fetch fresh data first, use cache as fallback if error.
- Delete, flush, and stats API.
- **Supports both CommonJS (`require`) and ES6 Modules (`import`)**.
- TypeScript definitions included.
- Zero dependencies.

---

## 📦 Installation

```bash
npm install simple-cache-id
```

---

## 🚀 Quick Start

### Two Powerful Caching Strategies

```js
const SimpleCache = require("simple-cache-id");
const cache = new SimpleCache(60); // 60s default TTL

// 🎯 wrap() - Cache-first (fast, great for static data)
const user = await cache.wrap("user:1", async () => {
  return await fetchFromDB(1); // Only called if not cached
});

// 🔄 fallback() - Fresh-first (resilient, great for APIs)
const weather = await cache.fallback("weather:jakarta", async () => {
  return await fetchWeatherAPI(); // Tries fresh data first
  // Falls back to cache if API fails ✨
});
```

**Why use `fallback()`?**
- ✅ Always tries to get fresh data first
- ✅ Resilient to API failures with automatic cache fallback
- ✅ Perfect for external APIs, network requests, and real-time data
- ✅ Provides offline support automatically

---

## 🚀 Usage

### Basic Usage

#### CommonJS (require)
```js
const SimpleCache = require("simple-cache-id");

// Default TTL = 5 seconds, check interval = 5 seconds
const cache = new SimpleCache(5, { checkInterval: 5 });

// Set & Get
cache.set("foo", "bar");
console.log(cache.get("foo")); // bar

// Override TTL per key
cache.set("baz", "qux", 1);

// Wrap (sync)
cache.wrap("pi", () => Math.PI).then(console.log); // 3.141592653589793

// Wrap (async)
async function fetchUser(id) {
  console.log("Fetching from DB...");
  return { id, name: "Ali" };
}

(async () => {
  const user1 = await cache.wrap("user:1", () => fetchUser(1), 10);
  console.log(user1); // { id: 1, name: "Ali" }

  const user2 = await cache.wrap("user:1", () => fetchUser(1));
  console.log(user2); // from cache, no DB call
})();

// Clean up when done
cache.destroy();
```

#### ES6 Module (import)
```js
import SimpleCache from "simple-cache-id";

// Default TTL = 5 seconds, check interval = 5 seconds
const cache = new SimpleCache(5, { checkInterval: 5 });

// Set & Get
cache.set("foo", "bar");
console.log(cache.get("foo")); // bar

// Override TTL per key
cache.set("baz", "qux", 1);

// Wrap (async)
async function fetchUser(id) {
  console.log("Fetching from DB...");
  return { id, name: "Ali" };
}

const user = await cache.wrap("user:1", () => fetchUser(1), 10);
console.log(user); // { id: 1, name: "Ali" }

// Clean up when done
cache.destroy();
```

#### TypeScript
```typescript
import SimpleCache from "simple-cache-id";

interface User {
  id: number;
  name: string;
}

const cache = new SimpleCache(60);
cache.set("user:1", { id: 1, name: "Alice" });

const user = cache.get<User>("user:1");
console.log(user?.name); // Alice
```

For more examples, see [EXAMPLES.md](EXAMPLES.md).

### Persistent Mode (New in v1.1.0!)

```js
const SimpleCache = require("simple-cache-id");

// Enable persistent storage with cache name
const cache = new SimpleCache(60, {
  checkInterval: 5,
  persistent: true,
  name: 'my-app-cache', // Required! Creates ./.cache/my-app-cache.sdb
  saveDelay: 3 // Auto-saves 3 seconds after last change (default: 3)
});

// Or use custom path instead of name
const cache2 = new SimpleCache(60, {
  persistent: true,
  persistPath: './custom/path/cache.sdb' // Alternative to 'name'
});

// Set data
cache.set("user:1", { id: 1, name: "Alice" }, 3600); // 1 hour TTL
cache.set("config", { theme: "dark" }, 0); // permanent (no TTL)

// Data is auto-saved 3 seconds after last change
// No need to call destroy() unless you want immediate save

// On next app restart...
const cache3 = new SimpleCache(60, {
  persistent: true,
  name: 'my-app-cache' // Same name = same cache file
});

console.log(cache3.get("user:1")); // { id: 1, name: "Alice" }
console.log(cache3.get("config")); // { theme: "dark" }
```

### Shared Mode - Cache Across Multiple Services

Share cache between multiple microservices using HTTP (zero config, automatic):

```js
// shared-cache.js - Create shared cache instance
const SimpleCache = require("simple-cache-id");
const cache = new SimpleCache(60, { shared: true });
module.exports = cache;

// Service A (separate process)
const cache = require('./shared-cache');
await cache.set('user:1', { name: 'Alice' });

// Service B (separate process)
const cache = require('./shared-cache');
const user = await cache.get('user:1'); // Gets { name: 'Alice' } from Service A!
```

**How it works:**
- First instance automatically starts HTTP server (holds data in memory)
- All other instances become clients (send requests to server)
- All methods become async - use `await`
- Perfect for microservices architecture

**Example:**
```js
// Service A
const cache = require('./shared-cache');
await cache.set('products', [...]);
await cache.set('config', {...});

// Service B (different process)
const cache = require('./shared-cache');
const products = await cache.get('products'); // Shared data!
const stats = await cache.stats(); // { keys: 2 }
```

### Backward Compatibility

```js
// Old style (still supported)
const cache = new SimpleCache(5, 10); // (defaultTtl, checkInterval)

// New style (recommended)
const cache = new SimpleCache(5, { checkInterval: 10 });
```

---

## 🧪 Testing

```bash
npm test
```

Jest is used for testing. All tests must pass before publishing.

---

## 📂 Project Structure

```
src/       → main source code
test/      → jest test suite
example/   → usage examples
.github/   → CI workflows
```

---

## 📜 API

### `new SimpleCache(defaultTtl = 0, options = {})`

Create a new cache instance with an optional default TTL (in seconds).

**Parameters:**
- `defaultTtl` (number): Default TTL in seconds (0 = no expiration)
- `options` (object):
  - `checkInterval` (number): Interval to check for expired keys in seconds (default: 5)
  - `persistent` (boolean): Enable persistent storage to binary file (default: false)
  - `name` (string): **Required if `persistent=true`** - Unique cache name (creates `./.cache/{name}.sdb`)
  - `persistPath` (string): Custom path to binary file (overrides `name`)
  - `saveDelay` (number): Debounce delay in seconds before auto-save (default: 3)
  - `shared` (boolean): Enable shared cache mode via HTTP - all methods become async (default: false)

**Important:**
- When `persistent: true`, you must provide either `name` or `persistPath`.
- When `shared: true`, all methods return Promises - use `await`.

**Example:**
```js
// Using name (recommended)
const cache = new SimpleCache(10, {
  checkInterval: 5,
  persistent: true,
  name: 'user-cache', // Creates ./.cache/user-cache.sdb
  saveDelay: 5 // Auto-saves 5 seconds after last change
});

// Using custom path
const cache2 = new SimpleCache(10, {
  persistent: true,
  persistPath: './data/cache.sdb'
});

// Using shared mode (for microservices)
const cache3 = new SimpleCache(60, {
  shared: true // All methods become async
});
```

### `set(key, value, ttl?)`

Store a value. TTL overrides the default if provided.

**Parameters:**
- `key` (string): Unique cache key
- `value` (any): Value to store
- `ttl` (number, optional): TTL in seconds, defaults to constructor TTL

**Returns:** `"OK"`

### `get(key)`

Retrieve a value (returns `null` if not found or expired).

**Parameters:**
- `key` (string): Cache key

**Returns:** The cached value or `null`

### `del(key)`

Delete a key (returns `1` if deleted, `0` if not found).

**Parameters:**
- `key` (string): Cache key

**Returns:** `1` if deleted, `0` if not found

### `flush()`

Clear all keys and stop cleanup interval.

### `destroy()`

Destroy cache instance, stop all intervals, and immediately save to binary file if persistent mode is enabled.

**Note:** With auto-save (debounced), you don't need to call `destroy()` on normal exit. However, calling it ensures immediate save and proper cleanup.

### `stats()`

Returns `{ keys: number }`.

**Example:**
```js
console.log(cache.stats()); // { keys: 5 }
```

### `wrap(key, fn, ttl?)`

Return value from cache or compute it if missing.
`fn` can be sync or async.

**Parameters:**
- `key` (string): Cache key
- `fn` (function): Function to compute value if not cached
- `ttl` (number, optional): Override TTL in seconds

**Returns:** Promise resolving to the cached or computed value

**Example:**
```js
const result = await cache.wrap("expensive-op", async () => {
  // Expensive computation
  return await fetchFromDatabase();
}, 3600);
```

### `fallback(key, fn, ttl?)`

Try to get fresh data first, use cache as fallback if error occurs.
This is the opposite of `wrap()` - it prioritizes fresh data over cached data.

**Parameters:**
- `key` (string): Cache key
- `fn` (function): Function to fetch fresh data
- `ttl` (number, optional): Override TTL in seconds

**Returns:** Promise resolving to fresh or cached value

**Throws:** Error if both function fails and no cache available

**Behavior:**
1. Try to execute `fn()` to get fresh data
2. If successful, cache the result and return it
3. If failed, try to get from cache
4. If cache exists, return cached value
5. If no cache, throw the original error

**Example:**
```js
// Fetch fresh data from API, use cache if API fails
const weather = await cache.fallback("weather:jakarta", async () => {
  // This might fail due to network issues
  return await fetchWeatherAPI("Jakarta");
}, 300);
```

**Use Cases:**
- API calls with fallback to cached data
- External service calls with resilience
- Real-time data with stale-data fallback
- Network requests with offline support

**Comparison:**
- `wrap()`: Cache-first (fast, may serve stale data)
- `fallback()`: Fresh-first (fresh data, resilient to failures)

---

## 💾 Persistent Storage

When `persistent: true`, the cache uses a custom binary format (`.sdb` file) similar to Redis RDB:

- **On constructor:** Automatically loads from binary file (if exists)
- **During runtime:** All operations happen in memory only (zero I/O overhead)
- **Auto-save:** Debounced save (N seconds after last change, default: 3 seconds)
- **On destroy:** Immediately saves snapshot to binary file (only non-expired entries)
- **Graceful shutdown:** Automatically saves on SIGINT/SIGTERM/beforeExit

**Binary Format:**
- Header: Magic "SDB", version, entry count
- Entry: Key length, key, expiry time, value JSON length, value JSON
- Atomic writes using temp file + rename strategy

**TTL Handling:**
- Only saves entries with valid TTL (not expired)
- Expired entries are filtered out on both save and load
- Supports permanent keys (TTL = 0)

**Multiple Instances:**
- Each cache name/path can only have ONE active instance
- Prevents data corruption from concurrent writes
- Throws error if file is already in use

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- Report bugs and suggest features
- Submit pull requests
- Improve documentation
- Develop plugins

---

## 📄 License

[MIT](LICENSE) © 2025
