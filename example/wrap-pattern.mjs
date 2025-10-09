// ES6 Module Example - Wrap Pattern for API Caching
import SimpleCache from "../src/index.mjs";

console.log("=== Wrap Pattern Example (ESM) ===\n");

// Simulated API calls
async function fetchUserFromAPI(userId) {
  console.log(`🌐 Fetching user ${userId} from API...`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    createdAt: new Date().toISOString()
  };
}

async function fetchPostsFromAPI(userId) {
  console.log(`🌐 Fetching posts for user ${userId} from API...`);
  await new Promise(resolve => setTimeout(resolve, 300));
  return [
    { id: 1, title: "First Post", body: "Hello World" },
    { id: 2, title: "Second Post", body: "Another post" }
  ];
}

// Create cache with 5 minute TTL
const cache = new SimpleCache(300);

async function getUser(userId) {
  return cache.wrap(`user:${userId}`, () => fetchUserFromAPI(userId));
}

async function getPosts(userId) {
  return cache.wrap(`posts:${userId}`, () => fetchPostsFromAPI(userId));
}

// Demo
async function demo() {
  console.log("1️⃣ First call - will fetch from API:");
  const user1 = await getUser(123);
  console.log("   Result:", user1);

  console.log("\n2️⃣ Second call - will use cache:");
  const user2 = await getUser(123);
  console.log("   Result:", user2);

  console.log("\n3️⃣ Fetch posts - will fetch from API:");
  const posts1 = await getPosts(123);
  console.log("   Result:", posts1);

  console.log("\n4️⃣ Fetch posts again - will use cache:");
  const posts2 = await getPosts(123);
  console.log("   Result:", posts2);

  console.log("\n📊 Cache stats:", cache.stats());

  cache.destroy();
}

demo().catch(console.error);
