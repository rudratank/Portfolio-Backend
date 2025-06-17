const memoryCache = new Map();

// Routes that should NOT be cached (admin/dynamic content)
const NO_CACHE_ROUTES = [
  "/api/certificate",
  "/api/home",
  "/api/about",
  "/api/education",
  "/api/skills",
  "/api/project",
  "/api/dashboard",
  "/api/messages",
  "/api/upload",
  "/api/auth",
  "api/user/skills",
];

// Routes that can be cached (public user-facing data)
const CACHE_ROUTES = [
  "/api/user", // Only cache public user data
];

function shouldCache(url) {
  // Don't cache admin routes
  if (NO_CACHE_ROUTES.some((route) => url.startsWith(route))) {
    return false;
  }

  // Only cache specific public routes
  return CACHE_ROUTES.some((route) => url.startsWith(route));
}

function cacheMiddleware(req, res, next) {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next();
  }

  const cacheKey = req.originalUrl;

  // Check if this route should be cached
  if (!shouldCache(cacheKey)) {
    return next();
  }

  const cachedResponse = memoryCache.get(cacheKey);

  if (cachedResponse) {
    console.log(`Cache hit for: ${cacheKey}`);
    return res.json(cachedResponse);
  }

  // Store original json method
  res.sendResponse = res.json;
  res.json = (data) => {
    // Only cache successful responses
    if (res.statusCode === 200) {
      console.log(`Caching response for: ${cacheKey}`);
      memoryCache.set(cacheKey, data);

      // Set shorter cache duration for user data (5 minutes)
      setTimeout(() => {
        memoryCache.delete(cacheKey);
        console.log(`Cache expired for: ${cacheKey}`);
      }, 5 * 60 * 1000); // 5 minutes
    }

    res.sendResponse(data);
  };

  next();
}

// Cache invalidation function
export function invalidateCache(pattern) {
  const keysToDelete = [];

  for (const [key] of memoryCache) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => {
    memoryCache.delete(key);
    console.log(`Cache invalidated: ${key}`);
  });
}

// Clear all cache
export function clearAllCache() {
  memoryCache.clear();
  console.log("All cache cleared");
}

// Get cache stats
export function getCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}

export default cacheMiddleware;
