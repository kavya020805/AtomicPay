/**
 * Fraud Detection Consumer
 * Applies simple heuristic rules to detect suspicious payment activity.
 *
 * Rules:
 * 1. Flag transfers over $5,000
 * 2. Flag if user has more than 5 transfers in the last 5 minutes
 * 3. Flag self-referencing patterns (circular transfers)
 */

const db = require('../config/db');

const HIGH_VALUE_THRESHOLD_CENTS = 500000; // $5,000
const RAPID_TRANSFER_LIMIT = 5;
const RAPID_TRANSFER_WINDOW_MINUTES = 5;

async function handleFraud(event) {
  const { transactionId, senderId, receiverId, amountInCents } = event;
  const flags = [];

  // Rule 1: High-value transfer
  if (amountInCents >= HIGH_VALUE_THRESHOLD_CENTS) {
    flags.push({
      rule: 'HIGH_VALUE',
      severity: 'warning',
      message: `Transfer of $${(amountInCents / 100).toFixed(2)} exceeds $${(HIGH_VALUE_THRESHOLD_CENTS / 100).toFixed(2)} threshold`,
    });
  }

  // Rule 2: Rapid successive transfers
  const recentTxResult = await db.query(
    `SELECT COUNT(*) FROM transactions
     WHERE sender_id = $1
     AND created_at > NOW() - INTERVAL '${RAPID_TRANSFER_WINDOW_MINUTES} minutes'`,
    [senderId]
  );
  const recentCount = parseInt(recentTxResult.rows[0].count, 10);

  if (recentCount > RAPID_TRANSFER_LIMIT) {
    flags.push({
      rule: 'RAPID_TRANSFERS',
      severity: 'warning',
      message: `User has ${recentCount} transfers in the last ${RAPID_TRANSFER_WINDOW_MINUTES} minutes`,
    });
  }

  // Rule 3: Check for circular transfer pattern (A→B→A)
  const circularResult = await db.query(
    `SELECT COUNT(*) FROM transactions
     WHERE sender_id = $1 AND receiver_id = $2
     AND created_at > NOW() - INTERVAL '10 minutes'`,
    [receiverId, senderId]
  );
  const circularCount = parseInt(circularResult.rows[0].count, 10);

  if (circularCount > 0) {
    flags.push({
      rule: 'CIRCULAR_TRANSFER',
      severity: 'alert',
      message: `Circular transfer pattern detected: ${receiverId} recently sent money to ${senderId}`,
    });
  }

  // Record fraud analysis result
  const fraudStatus = flags.length > 0 ? 'flagged' : 'clean';
  await db.query(
    `INSERT INTO payment_events (transaction_id, event_type, payload, processed_by)
     VALUES ($1, $2, $3, 'fraud-consumer')`,
    [
      transactionId,
      `fraud.${fraudStatus}`,
      JSON.stringify({ flags, analyzedAt: new Date().toISOString() }),
    ]
  );

  if (flags.length > 0) {
    console.log(`🚨 Fraud: tx ${transactionId} flagged — ${flags.map(f => f.rule).join(', ')}`);
  } else {
    console.log(`✅ Fraud: tx ${transactionId} passed all checks`);
  }
}

module.exports = { handleFraud };
