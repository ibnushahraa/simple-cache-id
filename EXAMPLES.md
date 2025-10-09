# Usage Examples

## CommonJS (require)

```javascript
const SimpleCache = require('simple-cache-id');

const cache = new SimpleCache(60); // 60 seconds default TTL
cache.set('user:1', { name: 'John', age: 30 });

const user = cache.get('user:1');
console.log(user); // { name: 'John', age: 30 }
```

## ES6 Module (import)

```javascript
import SimpleCache from 'simple-cache-id';

const cache = new SimpleCache(60); // 60 seconds default TTL
cache.set('user:1', { name: 'John', age: 30 });

const user = cache.get('user:1');
console.log(user); // { name: 'John', age: 30 }
```

## TypeScript

```typescript
import SimpleCache from 'simple-cache-id';

interface User {
  name: string;
  age: number;
}

const cache = new SimpleCache(60);
cache.set('user:1', { name: 'John', age: 30 });

const user = cache.get<User>('user:1');
console.log(user?.name); // John
```

## With Persistent Storage

### CommonJS
```javascript
const SimpleCache = require('simple-cache-id');

const cache = new SimpleCache(0, {
  persistent: true,
  name: 'my-app-cache',
  saveDelay: 3
});

cache.set('key', 'value');
// Data will be saved to .cache/my-app-cache.sdb
```

### ES6 Module
```javascript
import SimpleCache from 'simple-cache-id';

const cache = new SimpleCache(0, {
  persistent: true,
  name: 'my-app-cache',
  saveDelay: 3
});

cache.set('key', 'value');
// Data will be saved to .cache/my-app-cache.sdb
```

## Using wrap() Helper

### CommonJS
```javascript
const SimpleCache = require('simple-cache-id');

const cache = new SimpleCache(300); // 5 minutes

async function getUser(id) {
  return await cache.wrap(`user:${id}`, async () => {
    // This will only run if cache miss
    const response = await fetch(`https://api.example.com/users/${id}`);
    return response.json();
  });
}
```

### ES6 Module
```javascript
import SimpleCache from 'simple-cache-id';

const cache = new SimpleCache(300); // 5 minutes

async function getUser(id) {
  return await cache.wrap(`user:${id}`, async () => {
    // This will only run if cache miss
    const response = await fetch(`https://api.example.com/users/${id}`);
    return response.json();
  });
}
```
