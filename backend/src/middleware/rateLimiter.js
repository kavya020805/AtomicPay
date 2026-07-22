const { getRedisClient } = require('../config/redis');

/**
 * Redis-backed sliding window rate limiter.
 * Uses sorted sets for precise window tracking.
 *
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.max - Max requests per window (default: 10)
 * @param {string} options.keyPrefix - Redis key prefix (default: 'rl')
 * @param {string} [options.message] - Custom error message
 */
function createRateLimiter({ windowMs = 60000, max = 10, keyPrefix = 'rl', message } = {}) {
  return async (req, res, next) => {
    const redis = getRedisClient();
    
    // Use user ID if authenticated, otherwise use IP
    const identifier = req.user?.id || req.ip || 'unknown';
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Use a pipeline for atomicity
      const pipeline = redis.pipeline();
      
      // Remove entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count entries in the current window
      pipeline.zcard(key);
      
      // Add the current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set TTL on the key
      pipeline.pexpire(key, windowMs);

      const results = await pipeline.exec();
      const requestCount = results[1][1]; // zcard result

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - requestCount - 1),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
      });

      if (requestCount >= max) {
        const retryAfter = Math.ceil(windowMs / 1000);
        res.set('Retry-After', retryAfter);
        return res.status(429).json({
          error: message || 'Too many requests. Please try again later.',
          retryAfter,
        });
      }

      next();
    } catch (err) {
      // If Redis is down, allow the request through (fail open)
      console.error('⚠️ Rate limiter error (failing open):', err.message);
      next();
    }
  };
}

// Pre-configured rate limiters
const transferLimiter = createRateLimiter({
  windowMs: 60000,  // 1 minute
  max: 10,
  keyPrefix: 'rl:transfer',
  message: 'Too many transfer requests. Maximum 10 per minute.',
});

const authLimiter = createRateLimiter({
  windowMs: 60000,  // 1 minute
  max: 5,
  keyPrefix: 'rl:auth',
  message: 'Too many login attempts. Please try again later.',
});

const apiLimiter = createRateLimiter({
  windowMs: 60000,
  max: 60,
  keyPrefix: 'rl:api',
  message: 'API rate limit exceeded.',
});

module.exports = { createRateLimiter, transferLimiter, authLimiter, apiLimiter };
