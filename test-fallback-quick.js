const SimpleCache = require('./src/index.js');

const cache = new SimpleCache(60);

console.log('Cache instance created');
console.log('fallback method exists:', typeof cache.fallback);
console.log('wrap method exists:', typeof cache.wrap);

console.log('\nAvailable methods:');
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(cache)).filter(m => m !== 'constructor');
console.log(methods);

// Test fallback
(async () => {
    try {
        const result = await cache.fallback('test', async () => {
            return 'fresh data';
        });
        console.log('\nFallback test result:', result);
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
