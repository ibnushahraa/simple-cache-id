# Examples

This directory contains example files demonstrating how to use `simple-cache-id` with different module systems.

## CommonJS Examples

### Basic Usage
```bash
node example/basic.js
```

Demonstrates:
- Setting and getting values
- TTL (Time To Live)
- Using the `wrap()` helper
- Cache statistics

### Persistent Cache
```bash
node example/persistent.js
```

Demonstrates:
- Persistent storage to disk
- Data survival across restarts
- Auto-save functionality

## ES Module Examples

### Basic Usage (ESM)
```bash
node example/basic.mjs
```

Same as CommonJS basic example but using ES6 `import` syntax.

### Persistent Cache (ESM)
```bash
node example/persistent.mjs
```

Same as CommonJS persistent example but using ES6 `import` syntax.

### Wrap Pattern
```bash
node example/wrap-pattern.mjs
```

Demonstrates:
- Using `wrap()` for API caching
- Avoiding redundant API calls
- Real-world usage pattern

## TypeScript Example

### Type-safe Cache
```bash
npx ts-node example/typescript-example.ts
```

Demonstrates:
- Type-safe cache operations
- Using interfaces with cache
- Generic type parameters
- Production-ready patterns

## File Overview

| File | Module System | Description |
|------|---------------|-------------|
| `basic.js` | CommonJS | Basic cache operations |
| `basic.mjs` | ES Module | Basic cache operations |
| `persistent.js` | CommonJS | Persistent storage demo |
| `persistent.mjs` | ES Module | Persistent storage demo |
| `wrap-pattern.mjs` | ES Module | API caching pattern |
| `typescript-example.ts` | TypeScript/ESM | Type-safe usage |

## Running Examples

Make sure you're in the project root directory before running the examples:

```bash
# From project root
cd simple-cache-id

# Run CommonJS examples
node example/basic.js
node example/persistent.js

# Run ES Module examples
node example/basic.mjs
node example/persistent.mjs
node example/wrap-pattern.mjs

# Run TypeScript example (requires ts-node)
npm install -g ts-node
npx ts-node example/typescript-example.ts
```

## Notes

- **CommonJS files** use `.js` extension and `require()`
- **ES Module files** use `.mjs` extension and `import`
- **TypeScript files** use `.ts` extension and `import` with types
- All examples use relative imports (`../src/index.js` or `../src/index.mjs`)
- When using the published npm package, replace `../src/index` with `simple-cache-id`

## Converting for Production

When using in your own project after installing from npm:

**Change this:**
```javascript
import SimpleCache from "../src/index.mjs";
```

**To this:**
```javascript
import SimpleCache from "simple-cache-id";
```

The package.json `exports` field will automatically resolve to the correct file (`.js` for CommonJS, `.mjs` for ESM).
