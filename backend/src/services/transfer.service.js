const db = require('../config/db');
const { publishPaymentEvent } = require('./kafka.service');
const { acquireLock, releaseLock, cachePaymentStatus, invalidateUserBalance } = require('./redis.service');

/**
 * Execute an atomic P2P transfer with:
 * 1. Redis distributed lock (prevents concurrent duplicate processing)
 * 2. PostgreSQL ACID transaction with row-level locking (prevents race conditions)
 * 3. Kafka event publishing (async notifications, audit, fraud)
 * 4. Redis payment status caching (fast polling)
 *
 * @param {object} params
 * @param {string} params.senderId - Sender user UUID
 * @param {string} params.receiverId - Receiver user UUID
 * @param {number} params.amountInCents - Amount in cents
 * @param {string} params.idempotencyKey - UUID for idempotency
 * @param {string} [params.note] - Optional transfer note
 * @returns {object} { success, transaction, isIdempotent }
 */
async function executeTransfer({ senderId, receiverId, amountInCents, idempotencyKey, note }) {
  // ─── Validation ────────────────────────────────
  if (senderId === receiverId) {
    return { success: false, error: 'Cannot transfer to yourself', status: 400 };
  }

  if (amountInCents <= 0) {
    return { success: false, error: 'Amount must be greater than zero', status: 400 };
  }

  // ─── Fast-path Idempotency Check ──────────────
  if (idempotencyKey) {
    const existingTx = await db.query(
      'SELECT id, sender_id, receiver_id, amount_in_cents, status, created_at FROM transactions WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existingTx.rows.length > 0) {
      console.log(`⚡ Idempotency hit for key ${idempotencyKey}`);
      return {
        success: true,
        transaction: existingTx.rows[0],
        isIdempotent: true,
      };
    }
  }

  // ─── Redis Distributed Lock ───────────────────
  const lockKey = `transfer:${[senderId, receiverId].sort().join(':')}`;
  const lockValue = await acquireLock(lockKey, 15);

  if (!lockValue) {
    return {
      success: false,
      error: 'Transfer is being processed. Please wait.',
      status: 409,
    };
  }

  // ─── PostgreSQL ACID Transaction ──────────────
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Lock wallets in consistent order to prevent deadlocks
    const firstId = senderId < receiverId ? senderId : receiverId;
    const secondId = senderId < receiverId ? receiverId : senderId;

    await client.query('SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE', [firstId]);
    await client.query('SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE', [secondId]);

    // Check sender's balance
    const senderWallet = await client.query(
      'SELECT balance_in_cents FROM wallets WHERE user_id = $1',
      [senderId]
    );

    if (senderWallet.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Sender wallet not found', status: 404 };
    }

    const senderBalance = parseInt(senderWallet.rows[0].balance_in_cents, 10);
    if (senderBalance < amountInCents) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Insufficient funds', status: 400 };
    }

    // Deduct from sender
    await client.query(
      'UPDATE wallets SET balance_in_cents = balance_in_cents - $1, updated_at = NOW() WHERE user_id = $2',
      [amountInCents, senderId]
    );

    // Credit to receiver
    await client.query(
      'UPDATE wallets SET balance_in_cents = balance_in_cents + $1, updated_at = NOW() WHERE user_id = $2',
      [amountInCents, receiverId]
    );

    // Record the transaction
    const txResult = await client.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount_in_cents, status, idempotency_key, note, completed_at)
       VALUES ($1, $2, $3, 'completed', $4, $5, NOW())
       RETURNING id, sender_id, receiver_id, amount_in_cents, status, idempotency_key, note, created_at, completed_at`,
      [senderId, receiverId, amountInCents, idempotencyKey, note]
    );

    await client.query('COMMIT');

    const transaction = txResult.rows[0];

    // ─── Post-Transfer: Async Operations ──────────
    // These are non-blocking — failures don't roll back the transfer

    // Cache payment status in Redis
    cachePaymentStatus(transaction.id, {
      status: 'completed',
      amountInCents,
      senderId,
      receiverId,
      completedAt: transaction.completed_at,
    }).catch(err => console.error('⚠️ Redis cache error:', err.message));

    // Invalidate cached balances
    invalidateUserBalance(senderId).catch(() => {});
    invalidateUserBalance(receiverId).catch(() => {});

    // Publish to Kafka
    publishPaymentEvent('payment.completed', transaction)
      .catch(err => console.error('⚠️ Kafka publish error:', err.message));

    return {
      success: true,
      transaction,
      isIdempotent: false,
    };
  } catch (err) {
    await client.query('ROLLBACK');

    // Handle unique constraint violation (concurrent idempotency)
    if (err.code === '23505' && err.constraint === 'transactions_idempotency_key_key') {
      console.log('⚡ Concurrent idempotency clash blocked by DB constraint');
      const existing = await db.query(
        'SELECT id, sender_id, receiver_id, amount_in_cents, status FROM transactions WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      return {
        success: true,
        transaction: existing.rows[0],
        isIdempotent: true,
      };
    }

    console.error('❌ Transfer failed:', err.message);
    return { success: false, error: 'Transfer failed. Please try again.', status: 500 };
  } finally {
    client.release();
    // Always release the distributed lock
    releaseLock(lockKey, lockValue).catch(() => {});
  }
}

/**
 * Get payment status — checks Redis cache first, then DB.
 */
async function getTransferStatus(transactionId) {
  // Try Redis cache first
  const cached = await cachePaymentStatus(transactionId);
  if (cached) return cached;

  // Fall back to DB
  const result = await db.query(
    'SELECT id, status, amount_in_cents, sender_id, receiver_id, completed_at FROM transactions WHERE id = $1',
    [transactionId]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
}

module.exports = { executeTransfer, getTransferStatus };
