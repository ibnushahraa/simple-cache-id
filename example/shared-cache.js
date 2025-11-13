// shared-cache.js - Shared cache instance
const SimpleCache = require('../src/index.js');
const cache = new SimpleCache(60, { shared: true });
module.exports = cache;
