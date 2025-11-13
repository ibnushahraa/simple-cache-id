// service-a.js - Service A (client)
const cache = require('./shared-cache.js');

async function main() {
    console.log('[Service A] Setting key "user" = "Alice"');
    await cache.set('user', 'Alice');

    console.log('[Service A] Getting key "user"');
    const user = await cache.get('user');
    console.log('[Service A] Result:', user);

    console.log('[Service A] Stats:');
    const stats = await cache.stats();
    console.log('[Service A]', stats);
}

main().catch(console.error);
