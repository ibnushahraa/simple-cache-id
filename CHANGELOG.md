# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2025-01-03

### Changed
- Updated ROADMAP.md to reflect actual v1.2.0 features
- Updated README.md roadmap section for consistency
- Added `.npmignore` to exclude development files

## [1.2.0] - 2025-01-03

### Added
- **Debounced auto-save**: Automatic save N seconds after last change (default: 3 seconds)
  - New `saveDelay` option to configure debounce delay
  - Reduces disk I/O by batching multiple operations
  - Pending saves execute immediately on `destroy()` or graceful shutdown
- **Named cache instances**: Use `name` option for simpler cache file management
  - Auto-generates path as `./.cache/{name}.sdb`
  - Alternative to manual `persistPath` configuration
  - Detects main script directory for consistent paths
- **Multi-instance protection**: Prevents multiple instances using the same cache file
  - Throws error if cache file is already in use
  - Prevents data corruption from concurrent writes
  - Automatic cleanup on `destroy()`

### Changed
- **Breaking**: `persistent: true` now requires either `name` or `persistPath` option
  - Old: `{ persistent: true }` (used default path)
  - New: `{ persistent: true, name: 'my-cache' }` or `{ persistent: true, persistPath: './cache.sdb' }`
- Cache persistence no longer requires manual `destroy()` call
  - Auto-save handles most scenarios
  - `destroy()` still recommended for immediate save

### Improved
- Reduced disk I/O with debounced saves
- Better error messages for configuration issues
- More reliable graceful shutdown handling
- Clearer documentation for persistent mode

## [1.1.1] - 2025-01-03

### Added
- **Graceful shutdown**: Automatic cache save on process termination (SIGINT, SIGTERM, beforeExit)
- **Smart default path**: Auto-detect persist path based on main script location (`require.main`)
- **Multi-type key support**: Keys automatically converted to string (supports number, string, etc.)

### Fixed
- MaxListenersExceeded warning when creating multiple cache instances
- Persistent cache not saving on application shutdown
- Path inconsistency between save and load operations

### Improved
- Global event handler for all cache instances (prevents listener leak)
- Skip save operation if cache is empty on shutdown
- Better error messages for debugging

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
