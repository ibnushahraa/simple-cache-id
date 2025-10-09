// TypeScript Example - Type-safe Cache Usage
import SimpleCache from "../src/index.mjs";

// Define interfaces for type safety
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

interface CacheConfig {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

// Create typed cache instance
const cache = new SimpleCache(300); // 5 minutes default TTL

// Type-safe functions
async function getUser(userId: number): Promise<User | null> {
  return cache.wrap<User>(`user:${userId}`, async () => {
    console.log(`Fetching user ${userId}...`);
    // Simulated API call
    return {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      role: 'user'
    };
  });
}

async function getProduct(productId: number): Promise<Product | null> {
  return cache.wrap<Product>(`product:${productId}`, async () => {
    console.log(`Fetching product ${productId}...`);
    return {
      id: productId,
      name: `Product ${productId}`,
      price: 99.99,
      inStock: true
    };
  });
}

function getConfig(): CacheConfig | null {
  return cache.get<CacheConfig>('app:config');
}

function setConfig(config: CacheConfig): void {
  cache.set('app:config', config, 0); // Permanent
}

// Demo usage
async function demo() {
  console.log("=== TypeScript Type-safe Cache Example ===\n");

  // Set config
  const config: CacheConfig = {
    theme: 'dark',
    language: 'en',
    notifications: true
  };
  setConfig(config);
  console.log("✅ Config saved:", getConfig());

  // Get user with type safety
  const user = await getUser(1);
  if (user) {
    console.log(`\n✅ User fetched: ${user.name} (${user.role})`);
    console.log(`   Email: ${user.email}`);
  }

  // Get product with type safety
  const product = await getProduct(101);
  if (product) {
    console.log(`\n✅ Product fetched: ${product.name}`);
    console.log(`   Price: $${product.price}, In stock: ${product.inStock}`);
  }

  // Cache hit - no console log for "Fetching..."
  console.log("\n🔄 Getting cached user...");
  const cachedUser = await getUser(1);
  console.log("   Got from cache:", cachedUser?.name);

  console.log("\n📊 Cache stats:", cache.stats());

  cache.destroy();
}

demo().catch(console.error);
