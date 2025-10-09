// Test ESM and CommonJS compatibility
const path = require('path');
const fs = require('fs');

describe('Module System Support', () => {
    const testCachePath = path.join(__dirname, '.cache-test-module');

    afterEach(() => {
        // Cleanup test cache directory
        if (fs.existsSync(testCachePath)) {
            fs.rmSync(testCachePath, { recursive: true, force: true });
        }
    });

    describe('CommonJS (require)', () => {
        test('should support CommonJS require', () => {
            const SimpleCache = require('../src/index.js');
            expect(SimpleCache).toBeDefined();
            expect(typeof SimpleCache).toBe('function');

            const cache = new SimpleCache(10);
            expect(cache).toBeInstanceOf(SimpleCache);

            cache.set('test', 'value');
            expect(cache.get('test')).toBe('value');

            cache.destroy();
        });

        test('should handle basic operations', () => {
            const SimpleCache = require('../src/index.js');
            const cache = new SimpleCache(60);

            // Set and get
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');

            // Delete
            expect(cache.del('key1')).toBe(1);
            expect(cache.get('key1')).toBeNull();

            // Stats
            cache.set('a', 1);
            cache.set('b', 2);
            expect(cache.stats()).toEqual({ keys: 2 });

            // Flush
            cache.flush();
            expect(cache.stats()).toEqual({ keys: 0 });

            cache.destroy();
        });

        test('should support wrap() method', async () => {
            const SimpleCache = require('../src/index.js');
            const cache = new SimpleCache(60);

            let calls = 0;

            const result1 = await cache.wrap('test', async () => {
                calls++;
                return 'computed';
            });

            expect(result1).toBe('computed');
            expect(calls).toBe(1);

            // Second call should use cache
            const result2 = await cache.wrap('test', async () => {
                calls++;
                return 'computed';
            });

            expect(result2).toBe('computed');
            expect(calls).toBe(1); // Not called again

            cache.destroy();
        });

        test('should support persistent mode', () => {
            const SimpleCache = require('../src/index.js');
            const cachePath = path.join(testCachePath, 'test-cache.sdb');

            // Create directory
            if (!fs.existsSync(testCachePath)) {
                fs.mkdirSync(testCachePath, { recursive: true });
            }

            // Create cache and save data
            const cache1 = new SimpleCache(0, {
                persistent: true,
                persistPath: cachePath
            });
            cache1.set('persistent-key', 'persistent-value');
            cache1.destroy();

            // Load from persisted file
            const cache2 = new SimpleCache(0, {
                persistent: true,
                persistPath: cachePath
            });
            expect(cache2.get('persistent-key')).toBe('persistent-value');
            cache2.destroy();
        });

        test('should support TTL correctly', async () => {
            const SimpleCache = require('../src/index.js');
            const cache = new SimpleCache(1); // 1 second TTL

            cache.set('key', 'value');
            expect(cache.get('key')).toBe('value');

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            expect(cache.get('key')).toBeNull();

            cache.destroy();
        });

        test('should handle numeric keys', () => {
            const SimpleCache = require('../src/index.js');
            const cache = new SimpleCache(60);

            cache.set(123, 'numeric key');

            // Numeric keys are converted to strings internally
            expect(cache.get(123)).toBe('numeric key');
            expect(cache.get('123')).toBe('numeric key');

            // Setting with string '123' will override the numeric 123
            cache.set('123', 'string key');
            expect(cache.get(123)).toBe('string key');
            expect(cache.get('123')).toBe('string key');

            cache.destroy();
        });
    });

    describe('ES Module Support', () => {
        test('index.mjs file should exist', () => {
            const mjsPath = path.join(__dirname, '../src/index.mjs');
            expect(fs.existsSync(mjsPath)).toBe(true);
        });

        test('index.mjs should have export default', () => {
            const mjsPath = path.join(__dirname, '../src/index.mjs');
            const content = fs.readFileSync(mjsPath, 'utf8');

            // Check for ES6 import statements
            expect(content).toContain("import fs from 'fs'");
            expect(content).toContain("import path from 'path'");

            // Check for export default
            expect(content).toContain('export default SimpleCache');

            // Should NOT contain require or module.exports
            expect(content).not.toContain('module.exports');
            expect(content).not.toContain('require(');
        });

        test('package.json should have correct exports configuration', () => {
            const pkgPath = path.join(__dirname, '../package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

            // Check main fields
            expect(pkg.main).toBe('src/index.js');
            expect(pkg.module).toBe('src/index.mjs');

            // Check exports field
            expect(pkg.exports).toBeDefined();
            expect(pkg.exports['.']).toBeDefined();
            expect(pkg.exports['.'].import).toBe('./src/index.mjs');
            expect(pkg.exports['.'].require).toBe('./src/index.js');
            expect(pkg.exports['.'].types).toBe('./index.d.ts');
        });

        test('TypeScript definitions should support both CJS and ESM', () => {
            const dtsPath = path.join(__dirname, '../index.d.ts');
            const content = fs.readFileSync(dtsPath, 'utf8');

            // Should have both export styles
            expect(content).toContain('export = SimpleCache');
            expect(content).toContain('export default SimpleCache');
        });
    });

    describe('Documentation', () => {
        test('README should mention ESM support', () => {
            const readmePath = path.join(__dirname, '../README.md');
            const content = fs.readFileSync(readmePath, 'utf8');

            // Check for ES6 import examples
            expect(content).toContain('import SimpleCache from');
            expect(content).toContain('ES6 Module');
            expect(content).toContain('CommonJS');
        });

        test('EXAMPLES.md should exist with usage examples', () => {
            const examplesPath = path.join(__dirname, '../EXAMPLES.md');
            expect(fs.existsSync(examplesPath)).toBe(true);

            const content = fs.readFileSync(examplesPath, 'utf8');

            // Should have both CommonJS and ESM examples
            expect(content).toContain('CommonJS (require)');
            expect(content).toContain('ES6 Module (import)');
            expect(content).toContain('TypeScript');
            expect(content).toContain('import SimpleCache from');
            expect(content).toContain("const SimpleCache = require");
        });
    });
});
