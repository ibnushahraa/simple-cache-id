# simple-cache-id

[![npm version](https://img.shields.io/npm/v/simple-cache-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-cache-id)
[![npm downloads](https://img.shields.io/npm/dm/simple-cache-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-cache-id)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/ibnushahraa/simple-cache-id/actions/workflows/test.yml/badge.svg)](https://github.com/ibnushahraa/simple-cache-id/actions)

🔑 A lightweight **in-memory cache** for Node.js with **default TTL** and a simple `wrap()` helper.  
Think of it as a **tiny Redis-like cache** without any dependencies.

---

## ✨ Features

- Set / Get values with optional TTL (seconds).
- Global default TTL set in constructor.
- Auto-expiration with `setTimeout`.
- `wrap()` helper: fetch from cache or compute if missing.
- Delete, flush, and stats API.
- Zero dependencies.

---

## 📦 Installation

```bash
npm install simple-cache-id
```

---

## 🚀 Usage

```js
const SimpleCache = require("simple-cache-id");

// Default TTL = 5 seconds
const cache = new SimpleCache(5);

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

### `new SimpleCache(defaultTtl = 0)`

Create a new cache instance with an optional default TTL (in seconds).

### `set(key, value, ttl?)`

Store a value. TTL overrides the default if provided.

### `get(key)`

Retrieve a value (returns `null` if not found or expired).

### `del(key)`

Delete a key (returns `1` if deleted, `0` if not found).

### `flush()`

Clear all keys.

### `stats()`

Returns `{ keys: number }`.

### `wrap(key, fn, ttl?)`

Return value from cache or compute it if missing.  
`fn` can be sync or async.

---

## 📄 License

[MIT](LICENSE) © 2025
