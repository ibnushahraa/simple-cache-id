// test-service-b.js - Service B
const cache = require('./shared-cache.js');

async function main() {
    // Wait for Service A to set first
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[Service B] Getting key "test"');
    const result = await cache.get('test');
    console.log('[Service B] Result:', result);
    console.log('[Service B] Expected: "Hello World"');
    console.log('[Service B] Match:', result === 'Hello World' ? '✓' : '✗');
    console.log();

    console.log('[Service B] Deleting key "test"');
    const deleted = await cache.del('test');
    console.log('[Service B] Delete result:', deleted);
    console.log('[Service B] Expected: 1');
    console.log('[Service B] Match:', deleted === 1 ? '✓' : '✗');
}

main().catch(console.error);
