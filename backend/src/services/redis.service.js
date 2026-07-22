const { getRedisClient } = require('../config/redis');

const DEFAULT_SESSION_TTL = 86400; // 24 hours
const DEFAULT_CACHE_TTL = 300;     // 5 minutes
const DEFAULT_LOCK_TTL = 10;       // 10 seconds

// ─── Session Management ────────────────────────────

async function cacheSession(userId, sessionData, ttl = DEFAULT_SESSION_TTL) {
  const redis = getRedisClient();
  const key = `session:${userId}`;
  await redis.setex(key, ttl, JSON.stringify(sessionData));
}

async function getSession(userId) {
  const redis = getRedisClient();
  const key = `session:${userId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function deleteSession(userId) {
  const redis = getRedisClient();
  const key = `session:${userId}`;
  await redis.del(key);
}

// ─── Payment Status Cache ──────────────────────────

async function cachePaymentStatus(transactionId, status, ttl = DEFAULT_CACHE_TTL) {
  const redis = getRedisClient();
  const key = `payment:status:${transactionId}`;
  await redis.setex(key, ttl, JSON.stringify(status));
}

async function getPaymentStatus(transactionId) {
  const redis = getRedisClient();
  const key = `payment:status:${transactionId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

// ─── User Balance Cache ────────────────────────────

async function cacheUserBalance(userId, balance, ttl = 60) {
  const redis = getRedisClient();
  const key = `user:balance:${userId}`;
  await redis.setex(key, ttl, balance.toString());
}

async function getCachedUserBalance(userId) {
  const redis = getRedisClient();
  const key = `user:balance:${userId}`;
  const data = await redis.get(key);
  return data ? parseInt(data, 10) : null;
}

async function invalidateUserBalance(userId) {
  const redis = getRedisClient();
  const key = `user:balance:${userId}`;
  await redis.del(key);
}

// ─── Distributed Locks ─────────────────────────────

/**
 * Acquire a distributed lock using Redis SET NX with TTL.
 * @param {string} lockKey - Lock identifier
 * @param {number} ttl - Lock TTL in seconds
 * @returns {string|null} Lock value (for releasing) or null if not acquired
 */
async function acquireLock(lockKey, ttl = DEFAULT_LOCK_TTL) {
  const redis = getRedisClient();
  const key = `lock:${lockKey}`;
  const value = `${Date.now()}-${Math.random()}`;
  
  const result = await redis.set(key, value, 'EX', ttl, 'NX');
  return result === 'OK' ? value : null;
}

/**
 * Release a distributed lock (only if we own it).
 * Uses a Lua script for atomicity.
 */
async function releaseLock(lockKey, lockValue) {
  const redis = getRedisClient();
  const key = `lock:${lockKey}`;
  
  // Lua script: only delete if the value matches (we own the lock)
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  
  await redis.eval(script, 1, key, lockValue);
}

// ─── OTP Storage ────────────────────────────────────

async function storeOTP(userId, otp, ttl = 300) {
  const redis = getRedisClient();
  const key = `otp:${userId}`;
  await redis.setex(key, ttl, otp);
}

async function verifyOTP(userId, otp) {
  const redis = getRedisClient();
  const key = `otp:${userId}`;
  const stored = await redis.get(key);
  if (stored && stored === otp) {
    await redis.del(key); // One-time use
    return true;
  }
  return false;
}

module.exports = {
  cacheSession,
  getSession,
  deleteSession,
  cachePaymentStatus,
  getPaymentStatus,
  cacheUserBalance,
  getCachedUserBalance,
  invalidateUserBalance,
  acquireLock,
  releaseLock,
  storeOTP,
  verifyOTP,
};
