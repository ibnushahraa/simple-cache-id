// test-service-a.js - Service A
const cache = require('./shared-cache.js');

async function main() {
    console.log('[Service A] Setting key "test" = "Hello World"');
    await cache.set('test', 'Hello World');
    console.log('[Service A] Set complete\n');

    // Wait for Service B to delete
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[Service A] Getting key "test" after Service B deleted it');
    const result = await cache.get('test');
    console.log('[Service A] Result:', result);
    console.log('[Service A] Expected: null');
    console.log('[Service A] Match:', result === null ? '✓' : '✗');
}

main().catch(console.error);
