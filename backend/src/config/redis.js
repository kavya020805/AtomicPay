const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis;

function getRedisClient() {
  if (redis) return redis;

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        console.error('❌ Redis: max retries reached, giving up');
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      console.log(`🔄 Redis: retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
    lazyConnect: false,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  return redis;
}

async function disconnectRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('🔌 Redis disconnected');
  }
}

module.exports = { getRedisClient, disconnectRedis };
