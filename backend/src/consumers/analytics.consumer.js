/**
 * Analytics Consumer
 * Aggregates payment metrics for dashboards and reporting.
 * Tracks daily volume, per-user stats, and system-wide metrics.
 */

const db = require('../config/db');
const { getRedisClient } = require('../config/redis');

async function handleAnalytics(event) {
  const { transactionId, senderId, receiverId, amountInCents } = event;
  const redis = getRedisClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Track daily transaction count
    await redis.incr(`analytics:daily:count:${today}`);
    await redis.expire(`analytics:daily:count:${today}`, 172800); // 48h TTL

    // Track daily transaction volume (in cents)
    await redis.incrby(`analytics:daily:volume:${today}`, amountInCents);
    await redis.expire(`analytics:daily:volume:${today}`, 172800);

    // Track per-user send count
    await redis.incr(`analytics:user:sends:${senderId}:${today}`);
    await redis.expire(`analytics:user:sends:${senderId}:${today}`, 172800);

    // Track per-user receive count
    await redis.incr(`analytics:user:receives:${receiverId}:${today}`);
    await redis.expire(`analytics:user:receives:${receiverId}:${today}`, 172800);

    // Track total system-wide metrics (all-time)
    await redis.incr('analytics:total:count');
    await redis.incrby('analytics:total:volume', amountInCents);

    // Record analytics event in payment_events
    await db.query(
      `INSERT INTO payment_events (transaction_id, event_type, payload, processed_by)
       VALUES ($1, $2, $3, 'analytics-consumer')`,
      [
        transactionId,
        'analytics.recorded',
        JSON.stringify({
          date: today,
          amountInCents,
          senderId,
          receiverId,
        }),
      ]
    );

    console.log(`📊 Analytics: recorded metrics for tx ${transactionId} ($${(amountInCents / 100).toFixed(2)})`);
  } catch (err) {
    console.error(`❌ Analytics consumer error for tx ${transactionId}:`, err.message);
  }
}

module.exports = { handleAnalytics };
