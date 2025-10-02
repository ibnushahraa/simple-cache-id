# Roadmap

This document outlines the planned features and improvements for `simple-cache-id`.

---

## ✅ Released

### v1.0.0 - Initial Release
- In-memory cache with TTL support
- Basic operations: `set()`, `get()`, `del()`, `flush()`
- `wrap()` helper for cache-or-compute pattern
- Auto-expiration with setTimeout
- Zero dependencies

### v1.0.1 - TypeScript Support
- TypeScript definitions (`index.d.ts`)
- Type safety for TypeScript projects

### v1.1.0 - Persistent Storage (Current)
- Binary persistent storage (`.sdb` format)
- setInterval-based cleanup (more efficient)
- `destroy()` method for proper cleanup
- Auto-save on destroy, auto-load on constructor
- TTL-aware persistence (only saves valid entries)

---

## 🚀 Planned

### v1.2.0 - Core Improvements
**Focus: Production-ready core features**

- [ ] **LRU Eviction Policy**
  - `maxSize` option to limit cache entries
  - Auto-evict least recently used entries
  - Prevent memory leaks in long-running apps

- [ ] **Events/Hooks**
  - `on('set', callback)` - When key is set
  - `on('get', callback)` - When key is accessed
  - `on('expired', callback)` - When key expires
  - `on('evicted', callback)` - When key is evicted (LRU)
  - `on('delete', callback)` - When key is deleted
  - Useful for monitoring, logging, and metrics

- [ ] **Auto-save Interval**
  - `autoSave` option for periodic persistence
  - Configurable interval (e.g., every 5 minutes)
  - Better data safety without waiting for destroy

**Example:**
```js
const cache = new SimpleCache(60, {
  maxSize: 1000,
  evictionPolicy: 'lru',
  persistent: true,
  autoSave: 300, // Auto-save every 5 minutes
});

cache.on('evicted', (key) => {
  console.log(`Key evicted: ${key}`);
});
```

---

### v1.3.0 - Performance & Efficiency
**Focus: Optimization and advanced features**

- [ ] **Compression**
  - `compress: true` option for binary storage
  - Use gzip/zlib to reduce file size
  - Configurable compression level

- [ ] **Batch Operations**
  - `mset(object)` - Set multiple keys at once
  - `mget(keys[])` - Get multiple keys at once
  - `mdel(keys[])` - Delete multiple keys at once
  - Better performance for bulk operations

- [ ] **Namespace/Prefix Support**
  - `namespace(prefix)` - Create namespaced cache
  - Easy to flush by namespace
  - Better key organization

**Example:**
```js
// Batch operations
cache.mset({
  'user:1': { name: 'Alice' },
  'user:2': { name: 'Bob' }
});

const users = cache.mget(['user:1', 'user:2']);

// Namespace
const userCache = cache.namespace('user');
userCache.set('1', data); // Internally: "user:1"
```

---

### v1.4.0 - Plugin System (Extensions)
**Focus: Modular plugins that use the cache core**

Plugins are separate modules that leverage `simple-cache-id` for specific use cases.
Each plugin can be imported individually to keep core lightweight.

#### **Planned Plugins:**

##### 1. **OTP Validator** - `simple-cache-id/otp-validator`
Email/SMS OTP validation with automatic expiry

```js
const OTPValidator = require('simple-cache-id/otp-validator');

const otpValidator = new OTPValidator({
  ttl: 300,        // OTP expires in 5 minutes
  length: 6,       // 6-digit OTP
  maxAttempts: 3   // Max 3 verification attempts
});

// Generate OTP
const otp = otpValidator.generate('user@email.com');
console.log(otp); // "123456"

// Verify OTP
const isValid = otpValidator.verify('user@email.com', '123456');
console.log(isValid); // true

// Auto-expires after 5 minutes or 3 failed attempts
```

**Features:**
- Auto-generate numeric/alphanumeric OTP
- Configurable length and TTL
- Rate limiting (max attempts)
- Auto-cleanup on expiry
- Resend protection (cooldown period)

---

##### 2. **Rate Limiter** - `simple-cache-id/rate-limiter`
API rate limiting with sliding window algorithm

```js
const RateLimiter = require('simple-cache-id/rate-limiter');

const limiter = new RateLimiter({
  windowMs: 60000,  // 1 minute window
  maxRequests: 100, // Max 100 requests per window
  identifier: 'ip'  // or 'userId', custom function
});

// Express middleware example
app.use((req, res, next) => {
  const allowed = limiter.check(req.ip);

  if (!allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: limiter.retryAfter(req.ip)
    });
  }

  next();
});

// Manual check
const result = limiter.attempt('192.168.1.1');
console.log(result);
// { allowed: true, remaining: 99, resetAt: 1234567890 }
```

**Features:**
- Sliding window algorithm
- Configurable window and max requests
- Per-IP, per-user, or custom identifier
- `retryAfter()` for retry information
- Distributed-ready (can extend with Redis later)

---

##### 3. **Session Manager** - `simple-cache-id/session`
Simple session management for stateless apps

```js
const SessionManager = require('simple-cache-id/session');

const sessions = new SessionManager({
  ttl: 3600,           // 1 hour session
  slidingExpiration: true, // Reset TTL on access
  persistent: true     // Survive restarts
});

// Create session
const sessionId = sessions.create({ userId: 123, role: 'admin' });

// Get session
const session = sessions.get(sessionId);
console.log(session); // { userId: 123, role: 'admin' }

// Update session
sessions.update(sessionId, { lastActivity: Date.now() });

// Destroy session
sessions.destroy(sessionId);
```

**Features:**
- Auto-generate secure session IDs
- Sliding expiration (reset on access)
- Session data storage
- Bulk session operations
- Persistent sessions

---

##### 4. **Cache Warmer** - `simple-cache-id/warmer`
Pre-populate cache with frequently accessed data

```js
const CacheWarmer = require('simple-cache-id/warmer');

const warmer = new CacheWarmer(cache, {
  sources: [
    {
      key: 'users',
      fetch: async () => db.users.findAll(),
      ttl: 3600,
      schedule: '*/30 * * * *' // Refresh every 30 minutes
    },
    {
      key: 'config',
      fetch: async () => db.config.findOne(),
      ttl: 0 // Permanent
    }
  ]
});

// Warm cache on startup
await warmer.warmAll();

// Auto-refresh based on schedule
warmer.start();
```

**Features:**
- Pre-populate cache from data sources
- Scheduled refresh (cron-like)
- Lazy warming (on-demand)
- Error handling and retry logic
- Progress tracking

---

##### 5. **Query Cache** - `simple-cache-id/query-cache`
Smart caching for database queries with automatic invalidation

```js
const QueryCache = require('simple-cache-id/query-cache');

const queryCache = new QueryCache({
  ttl: 300,
  invalidateOn: ['users.update', 'users.delete']
});

// Wrap database queries
const users = await queryCache.query(
  'users:list',
  () => db.users.findAll(),
  { tags: ['users'] }
);

// Invalidate by tag
queryCache.invalidate('users'); // Clears all queries tagged with 'users'
```

**Features:**
- Query result caching
- Tag-based invalidation
- Automatic key generation
- Stale-while-revalidate pattern
- Query deduplication

---

### v2.0.0 - Breaking Changes (Future)
**Focus: Major architecture improvements**

- [ ] **Alternative Storage Backends**
  - LevelDB backend for larger datasets
  - SQLite backend for queryable cache
  - Redis backend for distributed caching
  - Pluggable backend API

- [ ] **Memory Size Limit**
  - Limit by memory size (MB) instead of key count
  - More accurate memory management
  - Object size estimation

- [ ] **Improved Binary Format**
  - Version 2 of `.sdb` format
  - Better compression
  - Backward compatibility with v1

**Example:**
```js
const cache = new SimpleCache(60, {
  backend: 'leveldb',
  backendOptions: {
    path: './cache-db'
  },
  maxMemory: '100MB'
});
```

---

## 📋 Plugin Architecture

### Design Principles:
1. **Core stays lightweight** - No dependencies
2. **Plugins are optional** - Import only what you need
3. **Consistent API** - All plugins follow similar patterns
4. **Well-documented** - Each plugin has examples and tests
5. **Independently versioned** - Plugins can evolve separately

### Plugin Structure:
```
simple-cache-id/
├── src/
│   ├── index.js              # Core cache
│   └── plugins/
│       ├── otp-validator.js
│       ├── rate-limiter.js
│       ├── session.js
│       ├── warmer.js
│       └── query-cache.js
├── index.d.ts
└── package.json
```

### Usage Pattern:
```js
// Core only (lightweight)
const SimpleCache = require('simple-cache-id');

// With plugins (as needed)
const OTPValidator = require('simple-cache-id/otp-validator');
const RateLimiter = require('simple-cache-id/rate-limiter');
```

---

## 🎯 Guiding Principles

1. **Simplicity First** - Keep the core simple and focused
2. **Zero Dependencies** - Core library has no dependencies
3. **Opt-in Complexity** - Advanced features via plugins
4. **Production Ready** - Tested, documented, and reliable
5. **Developer Experience** - Clear API, good defaults, helpful errors

---

## 💬 Feedback & Suggestions

Have ideas for new features or plugins? Please open an issue on GitHub:
https://github.com/ibnushahraa/simple-cache-id/issues

We'd love to hear your use cases and suggestions!

---

## 📅 Timeline

- **v1.2.0** - Q1 2025 (Core improvements)
- **v1.3.0** - Q2 2025 (Performance & efficiency)
- **v1.4.0** - Q3 2025 (Plugin system)
- **v2.0.0** - Q4 2025 (Breaking changes)

*Timeline is tentative and subject to change based on community feedback and priorities.*
