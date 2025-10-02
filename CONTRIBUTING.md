# Contributing to simple-cache-id

Thank you for your interest in contributing to `simple-cache-id`! We welcome contributions from the community.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Plugin Development](#plugin-development)

---

## 📜 Code of Conduct

This project follows a Code of Conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When creating a bug report, include:**
- Clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Node.js version and OS
- Code sample or test case

**Example:**
```markdown
**Bug Description:**
Cache doesn't expire entries with TTL < 5 seconds

**Steps to Reproduce:**
1. Create cache: `const cache = new SimpleCache(1)`
2. Set key: `cache.set('key', 'value')`
3. Wait 2 seconds
4. Get key: `cache.get('key')`

**Expected:** null
**Actual:** 'value'

**Environment:**
- Node.js: v18.0.0
- OS: Ubuntu 22.04
- simple-cache-id: v1.1.0
```

### Suggesting Features

We love feature suggestions! Please check [ROADMAP.md](ROADMAP.md) first to see if it's already planned.

**When suggesting a feature, include:**
- Clear use case and problem it solves
- Proposed API (code examples)
- Alternative solutions you've considered
- Whether you're willing to implement it

**Example:**
```markdown
**Feature Request: Cache Statistics**

**Use Case:**
Monitor cache hit/miss rates for optimization

**Proposed API:**
```js
const stats = cache.getStats();
// {
//   keys: 100,
//   hits: 500,
//   misses: 50,
//   hitRate: 0.91
// }
```

**Alternatives:**
- Events-based tracking
- External monitoring

**Implementation:**
I'm willing to implement this feature.
```

### Improving Documentation

Documentation improvements are always welcome!

- Fix typos or clarify unclear sections
- Add more examples
- Improve API documentation
- Translate documentation (future)

---

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/simple-cache-id.git
   cd simple-cache-id
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

---

## 📁 Project Structure

```
simple-cache-id/
├── src/
│   ├── index.js              # Core cache implementation
│   └── plugins/              # Future: Plugin implementations
├── test/
│   └── cache.test.js         # Test suite
├── example/
│   ├── basic.js              # Basic usage example
│   └── persistent.js         # Persistent mode example
├── index.d.ts                # TypeScript definitions
├── CHANGELOG.md              # Version history
├── ROADMAP.md                # Future plans
├── CONTRIBUTING.md           # This file
└── README.md                 # Main documentation
```

---

## 📝 Coding Guidelines

### Style Guide

We follow standard JavaScript conventions:

**Variables & Functions:**
```js
// Use camelCase
const myVariable = 'value';
function myFunction() {}

// Use descriptive names
const userCache = new SimpleCache();  // Good
const c = new SimpleCache();          // Bad
```

**Classes:**
```js
// Use PascalCase
class SimpleCache {}
class OTPValidator {}
```

**Constants:**
```js
// Use UPPER_SNAKE_CASE for true constants
const DEFAULT_TTL = 0;
const MAX_RETRIES = 3;
```

**Private Methods:**
```js
// Prefix with underscore
_loadFromBinary() {}
_saveToBinary() {}
```

### Code Quality

- **Keep it simple** - Favor readability over cleverness
- **Avoid dependencies** - Core library has zero dependencies
- **Document complex logic** - Add comments for non-obvious code
- **Error handling** - Use try-catch and provide helpful error messages

**Example:**
```js
// Good: Clear and documented
/**
 * Load cache from binary file
 * @private
 */
_loadFromBinary() {
    try {
        // Check if file exists
        if (!fs.existsSync(this.persistPath)) {
            return; // file doesn't exist, skip
        }

        // Rest of implementation...
    } catch (err) {
        // Silent fail, start fresh on error
        console.error('Failed to load from binary:', err.message);
    }
}

// Bad: Unclear and undocumented
_load() {
    try {
        if (!fs.existsSync(this.p)) return;
        // ...
    } catch (e) {
        console.log(e);
    }
}
```

### JSDoc Comments

Add JSDoc comments for all public methods:

```js
/**
 * Store a value in the cache with optional TTL
 * @param {string} key - Unique cache key
 * @param {any} value - Value to store
 * @param {number} [ttl] - TTL in seconds, defaults to constructor TTL
 * @returns {"OK"}
 */
set(key, value, ttl) {
    // Implementation
}
```

---

## 🧪 Testing Guidelines

### Writing Tests

- Every feature must have tests
- Every bug fix must have a regression test
- Aim for high code coverage (>80%)

**Test Structure:**
```js
describe("Feature Name", () => {
    let cache;

    beforeEach(() => {
        cache = new SimpleCache(5, { checkInterval: 1 });
    });

    afterEach(() => {
        if (cache) {
            cache.destroy();
        }
    });

    it("should do something specific", () => {
        // Arrange
        cache.set("key", "value");

        // Act
        const result = cache.get("key");

        // Assert
        expect(result).toBe("value");
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Naming

- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"

```js
// Good
it("should return null when key doesn't exist", () => {});
it("should expire entry after TTL", () => {});
it("should save to binary file on destroy", () => {});

// Bad
it("works", () => {});
it("test get", () => {});
```

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat: add LRU eviction policy"
git commit -m "feat(persistent): add compression support"

# Bug fix
git commit -m "fix: prevent memory leak in cleanup interval"
git commit -m "fix(persistent): handle corrupted binary files"

# Documentation
git commit -m "docs: update README with persistent mode examples"

# Test
git commit -m "test: add tests for TTL expiration"

# Refactor
git commit -m "refactor: simplify binary serialization logic"
```

### Commit Message Body

For complex changes, add a body:

```
feat: add LRU eviction policy

Implements least recently used eviction when maxSize is reached.
This prevents memory leaks in long-running applications.

- Add maxSize option
- Track access order
- Auto-evict least recently used entries
- Add eviction event
```

---

## 🔄 Pull Request Process

### Before Submitting

1. ✅ **Tests pass** - `npm test` succeeds
2. ✅ **Code is formatted** - Follow style guide
3. ✅ **Documentation updated** - Update README if needed
4. ✅ **Commits follow guidelines** - Use conventional commits
5. ✅ **Branch is up to date** - Rebase on latest main

### PR Checklist

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally
- [ ] I have checked my code and corrected any misspellings
```

### PR Title

Follow conventional commits format:

```
feat: add LRU eviction policy
fix: prevent memory leak in cleanup interval
docs: improve persistent mode documentation
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be included in the next release

---

## 🔌 Plugin Development

### Plugin Guidelines

Plugins should:
- ✅ Be self-contained
- ✅ Use the core cache as a dependency
- ✅ Have their own tests
- ✅ Be well-documented
- ✅ Follow the same coding standards

### Plugin Structure

```js
// src/plugins/example-plugin.js

const SimpleCache = require('../index');

class ExamplePlugin {
    constructor(options = {}) {
        // Use SimpleCache internally
        this.cache = new SimpleCache(options.ttl || 60, {
            checkInterval: options.checkInterval || 5
        });

        // Plugin-specific options
        this.customOption = options.customOption;
    }

    // Plugin methods
    doSomething(key, value) {
        // Use cache internally
        this.cache.set(key, value);
    }

    cleanup() {
        this.cache.destroy();
    }
}

module.exports = ExamplePlugin;
```

### Plugin Testing

Create separate test file:

```js
// test/plugins/example-plugin.test.js

const ExamplePlugin = require('../../src/plugins/example-plugin');

describe('ExamplePlugin', () => {
    let plugin;

    beforeEach(() => {
        plugin = new ExamplePlugin({ ttl: 60 });
    });

    afterEach(() => {
        plugin.cleanup();
    });

    it('should work as expected', () => {
        // Test implementation
    });
});
```

### Plugin Documentation

Add plugin documentation to README:

```markdown
### Example Plugin

Description of what the plugin does.

**Installation:**
```js
const ExamplePlugin = require('simple-cache-id/example-plugin');
```

**Usage:**
```js
const plugin = new ExamplePlugin({
    ttl: 60,
    customOption: 'value'
});

plugin.doSomething('key', 'value');
```

**API:**
- `doSomething(key, value)` - Description
```

---

## 🎯 Priority Areas

We especially welcome contributions in these areas:

### High Priority
- [ ] LRU eviction implementation
- [ ] Events/hooks system
- [ ] Auto-save interval
- [ ] Performance optimizations

### Medium Priority
- [ ] Compression support
- [ ] Batch operations
- [ ] Namespace support
- [ ] More examples

### Plugins (v1.4.0)
- [ ] OTP Validator
- [ ] Rate Limiter
- [ ] Session Manager
- [ ] Cache Warmer
- [ ] Query Cache

---

## 📞 Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/ibnushahraa/simple-cache-id/discussions)
- **Bug reports?** Open an [Issue](https://github.com/ibnushahraa/simple-cache-id/issues)
- **Need help with PR?** Tag maintainers in your PR comments

---

## 🙏 Recognition

Contributors will be recognized in:
- CHANGELOG.md for their contributions
- README.md contributors section (coming soon)
- GitHub contributors page

---

## 📜 License

By contributing to `simple-cache-id`, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
