// service-b.js - Service B (client)
const cache = require('./shared-cache.js');

async function main() {
    console.log('[Service B] Getting key "user"');
    const user = await cache.get('user');
    console.log('[Service B] Result:', user);

    console.log('[Service B] Setting key "product" = "Laptop"');
    await cache.set('product', 'Laptop');

    console.log('[Service B] Stats:');
    const stats = await cache.stats();
    console.log('[Service B]', stats);
}

// Wait a bit for Service A to set data first
setTimeout(() => {
    main().catch(console.error);
}, 1000);
