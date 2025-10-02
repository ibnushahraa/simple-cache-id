# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-XX

### Added
- **Persistent storage mode**: Enable cache persistence to binary file (`.sdb` format)
  - `persistent` option to enable/disable persistent storage
  - `persistPath` option to specify binary file path
  - Automatic load from binary file on constructor
  - Automatic save to binary file on destroy
  - Binary format similar to Redis RDB with efficient serialization
  - Only stores entries with valid TTL (filters expired entries)
- `destroy()` method for proper cleanup and saving cache to disk
- TypeScript interface `SimpleCacheOptions` for better type safety
- Comprehensive test suite for persistent mode (8 new tests)

### Changed
- **Breaking (minor)**: Constructor signature changed from `new SimpleCache(defaultTtl, checkInterval)` to `new SimpleCache(defaultTtl, options)`
  - Backward compatible: old signature `new SimpleCache(5, 10)` still works
  - New signature: `new SimpleCache(5, { checkInterval: 10, persistent: true })`
- Changed expiry cleanup from `setTimeout` per key to single global `setInterval`
  - More efficient for caches with many keys
  - Configurable via `checkInterval` option (default: 5 seconds)
- All internal comments translated from Indonesian to English

### Improved
- Memory efficiency with single cleanup interval for all keys
- Better error handling for binary file operations
- Lazy deletion on `get()` for immediate cleanup
- Documentation with detailed API examples and persistent mode usage

## [1.0.1] - 2025-01-XX

### Added
- TypeScript definitions (`index.d.ts`)
- Type safety for TypeScript projects

## [1.0.0] - 2025-01-XX

### Added
- Initial release
- In-memory cache with TTL support
- `set()`, `get()`, `del()`, `flush()` operations
- `wrap()` helper for cache-or-compute pattern
- `stats()` for cache statistics
- Auto-expiration with `setTimeout`
- Zero dependencies
- Jest test suite
- MIT License
