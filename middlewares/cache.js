// middleware/cache.js
const NodeCache = require('node-cache');

// Create cache instance with default TTL of 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

/**
 * Cache middleware for GET requests
 */
exports.cacheMiddleware = (duration = 600) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create cache key from URL and query params
    const key = `${req.originalUrl || req.url}`;
    
    // Check if data exists in cache
    const cachedData = cache.get(key);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, data, duration);
      }
      
      originalJson.call(res, data);
    };
    
    next();
  };
};

/**
 * Clear cache by pattern
 */
exports.clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  matchingKeys.forEach(key => cache.del(key));
  
  return matchingKeys.length;
};