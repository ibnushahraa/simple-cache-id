# simple-cache-id

[![npm version](https://img.shields.io/npm/v/simple-cache-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-cache-id)
[![npm downloads](https://img.shields.io/npm/dm/simple-cache-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-cache-id)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/ibnushahraa/simple-cache-id/actions/workflows/test.yml/badge.svg)](https://github.com/ibnushahraa/simple-cache-id/actions)

🔑 A lightweight **in-memory cache** for Node.js with **default TTL**, **persistent storage**, and a simple `wrap()` helper.
Think of it as a **tiny Redis-like cache** without any dependencies.

---

## ✨ Features

- Set / Get values with optional TTL (seconds).
- Global default TTL set in constructor.
- Auto-expiration with `setInterval` cleanup.
- **Persistent storage to binary file (.sdb)** - cache survives restarts!
- `wrap()` helper: fetch from cache or compute if missing.
- Delete, flush, and stats API.
- TypeScript definitions included.
- Zero dependencies.

---

## 📦 Installation

```bash
npm install simple-cache-id
```

---

## 🚀 Usage

### Basic Usage

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

### Persistent Mode (New in v1.1.0!)

```js
const SimpleCache = require("simple-cache-id");

// Enable persistent storage
const cache = new SimpleCache(60, {
  checkInterval: 5,
  persistent: true
  // persistPath defaults to ./.cache/simple-cache.sdb
});

// Set data
cache.set("user:1", { id: 1, name: "Alice" }, 3600); // 1 hour TTL
cache.set("config", { theme: "dark" }, 0); // permanent (no TTL)

// Data is automatically saved to binary file on destroy
cache.destroy();

// Restart your app...
// Data is automatically loaded from binary file
const cache2 = new SimpleCache(60, {
  persistent: true
});

console.log(cache2.get("user:1")); // { id: 1, name: "Alice" }
console.log(cache2.get("config")); // { theme: "dark" }
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
  - `persistPath` (string): Path to binary file (default: './.cache/simple-cache.sdb')

**Example:**
```js
const cache = new SimpleCache(10, {
  checkInterval: 5,
  persistent: true,
  persistPath: './.cache/simple-cache.sdb' // optional, this is the default
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

Destroy cache instance, stop all intervals, and save to binary file if persistent mode is enabled.

**Important:** Always call `destroy()` before exiting your application when using persistent mode!

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

---

## 💾 Persistent Storage

When `persistent: true`, the cache uses a custom binary format (`.sdb` file) similar to Redis RDB:

- **On constructor:** Automatically loads from binary file (if exists)
- **During runtime:** All operations happen in memory only (zero I/O overhead)
- **On destroy:** Saves snapshot to binary file (only non-expired entries)

**Binary Format:**
- Header: Magic "SDB", version, entry count
- Entry: Key length, key, expiry time, value JSON length, value JSON
- Atomic writes using temp file + rename strategy

**TTL Handling:**
- Only saves entries with valid TTL (not expired)
- Expired entries are filtered out on both save and load
- Supports permanent keys (TTL = 0)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- Report bugs and suggest features
- Submit pull requests
- Improve documentation
- Develop plugins

---

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and future development.

**Upcoming:**
- **v1.2.0** - LRU eviction, Events/Hooks, Auto-save interval
- **v1.3.0** - Compression, Batch operations, Namespace support
- **v1.4.0** - Plugin system (OTP validator, Rate limiter, Session manager, etc.)

**Plugins (coming soon):**
```js
// Optional plugins that use simple-cache-id core
const OTPValidator = require('simple-cache-id/otp-validator');
const RateLimiter = require('simple-cache-id/rate-limiter');
const SessionManager = require('simple-cache-id/session');
```

---

## 📄 License

[MIT](LICENSE) © 2025
